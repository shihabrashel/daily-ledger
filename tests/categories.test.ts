import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { categoriesFor, categoryTranslationKey, expenseCategories, incomeCategories, normalizeExpenseCategory, searchCategories } from '@/constants/categories';
import en from '@/localization/locales/en.json';
import bn from '@/localization/locales/bn.json';
import i18n from '@/localization';
import { selectionForType } from '@/features/transactions/services/formRules';
import { transactionSchema } from '@/features/transactions/validation/transaction';
import { filterTransactions, summarize } from '@/features/transactions/services/calculations';
import { migrateExpenseCategories, storedLedgerSchema } from '@/storage/categoryMigration';
import { closeLedger } from '@/features/reports/closing';
import { reportContent, escapeHtml } from '@/features/reports/content';

const expected = [
  ['groceries', 'Groceries / Bazar', 'বাজার ও মুদি'],
  ['foodDining', 'Food & Dining', 'খাবার'],
  ['snacksDrinks', 'Snacks & Drinks', 'স্ন্যাকস ও পানীয়'],
  ['medicalHealthcare', 'Medical & Healthcare', 'চিকিৎসা ও ওষুধ'],
  ['houseRent', 'House Rent', 'বাসা ভাড়া'],
  ['electricity', 'Electricity', 'বিদ্যুৎ'], ['gas', 'Gas', 'গ্যাস'], ['internet', 'Internet', 'ইন্টারনেট'],
  ['phoneMobile', 'Phone & Mobile', 'ফোন ও মোবাইল'], ['transportation', 'Transportation', 'যাতায়াত'],
  ['bike', 'Bike', 'বাইক'], ['car', 'Car', 'গাড়ি'], ['education', 'Education', 'শিক্ষা'],
  ['donationCharity', 'Donation & Charity', 'দান ও সদকা'], ['familyPersonal', 'Family & Personal', 'পরিবার ও ব্যক্তিগত'],
  ['subscriptions', 'Subscriptions', 'সাবস্ক্রিপশন'], ['electronicsService', 'Electronics & Service', 'ইলেকট্রনিক্স ও সার্ভিস'],
  ['furnitureHousehold', 'Furniture & Household', 'আসবাবপত্র ও গৃহস্থালি'], ['serviceCharge', 'Service Charge', 'সার্ভিস চার্জ'],
  ['festival', 'Festival', 'উৎসব'], ['travelTour', 'Travel & Tour', 'ভ্রমণ ও ট্যুর'],
  ['taxProfessional', 'Tax & Professional', 'ট্যাক্স ও পেশাগত'], ['other', 'Other', 'অন্যান্য'],
] as const;
const transaction = {
  id: 'f9bc9056-4572-4b64-8d81-c59b825ec2a8', date: '2026-09-02', type: 'expense' as const,
  categoryId: 'medicine', amount: 1500.25, description: 'Insulin', necessity: 'optional' as const,
  createdAt: '2026-09-02T00:00:00.000Z', updatedAt: '2026-09-03T00:00:00.000Z',
};
const legacyLedger = { version: 1 as const, activeMonth: '2026-09', revision: 2, transactions: [transaction], reports: [] };

describe('expense catalogue and localization', () => {
  it('provides exactly the requested ordered 23 expense IDs', () => {
    expect(expenseCategories).toEqual(expected.map(([id]) => id));
    expect(new Set(expenseCategories).size).toBe(23);
  });
  it.each(expected)('localizes %s in both languages', (id, english, bangla) => {
    expect(en.categories[id]).toBe(english);
    expect(bn.categories[id]).toBe(bangla);
  });
  it('keeps the original income categories and translations', () => {
    expect(incomeCategories).toEqual(['salary', 'freelance', 'business', 'bonus', 'gift', 'investment', 'otherIncome']);
    expect(incomeCategories.map(id => en.categories[id])).toEqual(['Salary', 'Freelance', 'Business', 'Bonus', 'Gift', 'Investment', 'Other income']);
    expect(incomeCategories.map(id => bn.categories[id])).toEqual(['বেতন', 'ফ্রিল্যান্স', 'ব্যবসা', 'বোনাস', 'উপহার', 'বিনিয়োগ', 'অন্যান্য আয়']);
  });
  it.each(expenseCategories)('keeps %s user-selectable with either necessity', categoryId => {
    const schema = transactionSchema('2026-09', '2026-09-29');
    const form = { ...transaction, categoryId, amount: '1500.25' };
    expect(schema.safeParse({ ...form, necessity: 'essential' }).success).toBe(true);
    expect(schema.safeParse({ ...form, necessity: 'optional' }).success).toBe(true);
    expect(schema.safeParse({ ...form, necessity: undefined }).success).toBe(false);
    expect(selectionForType('income', categoryId, 'essential')).toEqual({ categoryId: '', necessity: undefined });
    expect(selectionForType('expense', categoryId, 'optional')).toEqual({ categoryId, necessity: 'optional' });
  });
  it.each(incomeCategories)('clears income category %s when switching to expense', category => {
    expect(selectionForType('expense', category, undefined)).toEqual({ categoryId: '', necessity: undefined });
  });
});

describe('localized dropdown search', () => {
  const search = (language: string, query: string, ids: readonly string[] = expenseCategories) =>
    searchCategories(ids, query, id => id ? i18n.getFixedT(language)(`categories.${id}`) : i18n.getFixedT(language)('allCategories'));
  it('matches English display names case-insensitively with trimmed whitespace', () => {
    expect(search('en', ' MED ')).toEqual(['medicalHealthcare']);
    expect(search('en', 'Food &')).toEqual(['foodDining']);
    expect(search('en', 'foodDining')).toEqual([]);
  });
  it('matches Bangla names instead of internal IDs', () => {
    expect(search('bn', 'চিকিৎসা')).toEqual(['medicalHealthcare']);
    expect(search('bn', 'medicalHealthcare')).toEqual([]);
    expect(search('bn', 'ভ্রমণ')).toEqual(['travelTour']);
  });
  it('preserves order, empty/no-match states, income search and the All filter', () => {
    expect(search('en', '')).toEqual(expenseCategories);
    expect(search('en', 'nonexistent')).toEqual([]);
    expect(search('en', 'salary', categoriesFor('income'))).toEqual(['salary']);
    expect(search('bn', 'বেতন', categoriesFor('income'))).toEqual(['salary']);
    expect(search('en', 'all categories', ['', ...expenseCategories])).toEqual(['']);
  });
});

describe('old expense category compatibility', () => {
  it.each([
    ['medicine', 'medicalHealthcare'], ['food', 'foodDining'], ['snacks', 'snacksDrinks'],
    ['rent', 'houseRent'], ['houseRent', 'houseRent'], ['transport', 'transportation'],
    ['donation', 'donationCharity'], ['family', 'familyPersonal'], ['otherExpense', 'other'],
    ['utilities', 'other'], ['utility', 'other'], ['shopping', 'other'], ['entertainment', 'other'],
    ['unknown-old-category', 'other'], ['__proto__', 'other'],
  ])('maps %s to %s', (oldId, newId) => expect(normalizeExpenseCategory(oldId)).toBe(newId));
  it('preserves every non-category field, all records, and all totals', () => {
    const original = { ...legacyLedger, transactions: [transaction, { ...transaction, id: '588b3406-63d4-4a58-93b9-eecf9d36b3ed', type: 'income' as const, categoryId: 'salary', necessity: undefined }] };
    const migrated = storedLedgerSchema.parse(original);
    expect(migrated.transactions).toEqual([{ ...transaction, categoryId: 'medicalHealthcare' }, original.transactions[1]]);
    expect(summarize(migrated.transactions)).toEqual(summarize(original.transactions));
    expect(filterTransactions(migrated.transactions, '2026-09', 'expense', 'medicalHealthcare')).toEqual([migrated.transactions[0]]);
    expect(original.transactions[0]?.categoryId).toBe('medicine');
    expect(migrateExpenseCategories(migrated)).toBe(migrated);
  });
  it('invalidates old closing snapshots without deleting retained reports', () => {
    const report = { id: 'c8d0c301-8c9b-46cf-829f-bd1c56c98c20', month: '2026-09', revision: 2, pdfUri: 'file:///a.pdf', excelUri: 'file:///a.xlsx', createdAt: transaction.createdAt, closed: false };
    const migrated = storedLedgerSchema.parse({ ...legacyLedger, reports: [report] });
    expect(migrated.revision).toBe(3);
    expect(migrated.reports).toEqual([report]);
    expect(() => closeLedger(migrated, report, new Date(2026, 9, 1))).toThrow('errors.staleReport');
  });
  it('does not reinterpret income categories or hide malformed transaction data', () => {
    for (const item of [{ ...transaction, amount: -1 }, { ...transaction, categoryId: null }, { ...transaction, necessity: undefined }, { ...transaction, type: 'income', necessity: undefined }]) {
      expect(storedLedgerSchema.safeParse({ ...legacyLedger, transactions: [item] }).success).toBe(false);
    }
    expect(storedLedgerSchema.safeParse({ ...legacyLedger, version: 99 }).success).toBe(false);
  });
});

describe('localized report categories', () => {
  it.each(['en', 'bn'])('renders every new category as a %s display name in PDF HTML and Excel', language => {
    const items = expenseCategories.map(categoryId => ({ ...transaction, categoryId }));
    const t = i18n.getFixedT(language);
    const { html, workbook } = reportContent('2026-09', items, language, t);
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(workbook.Sheets['Daily Ledger']!, { header: 1 });
    expect(rows.filter(row => row[0] === transaction.date).map(row => row[1])).toEqual(items.map(item => t(`categories.${item.categoryId}`)));
    for (const item of items) expect(html).toContain(escapeHtml(t(`categories.${item.categoryId}`)));
    expect(html).not.toContain('categories.');
    expect(html).not.toContain('medicalHealthcare');
  });
  it('resolves legacy/unknown expenses to localized names without exposing raw IDs', () => {
    expect(categoryTranslationKey('medicine', 'expense')).toBe('categories.medicalHealthcare');
    expect(categoryTranslationKey('unrecognized', 'expense')).toBe('categories.other');
    const { html } = reportContent('2026-09', [{ ...transaction, categoryId: 'unrecognized' }], 'bn', i18n.getFixedT('bn'));
    expect(html).toContain('অন্যান্য');
    expect(html).not.toContain('unrecognized');
  });
});
