import { describe, expect, it } from 'vitest';
import { summarize, filterTransactions } from '@/features/transactions/services/calculations';
import { currentMonth, isPreviousMonth, localDate, nextMonth, validDate } from '@/utils/date';
import { transactionSchema, emailSchema } from '@/features/transactions/validation/transaction';
import { canClose, closeLedger } from '@/features/reports/closing';
import type { Transaction } from '@/features/transactions/types';
import { ledgerSchema, type Ledger, type SavedReport } from '@/storage/models';
import en from '@/localization/locales/en.json';
import bn from '@/localization/locales/bn.json';

const income: Transaction = { id: '588b3406-63d4-4a58-93b9-eecf9d36b3ed', date: '2026-12-01', type: 'income', categoryId: 'salary', amount: 80000, createdAt: '2026-12-01T00:00:00.000Z' };
const essential: Transaction = { ...income, id: 'f9bc9056-4572-4b64-8d81-c59b825ec2a8', date: '2026-12-02', type: 'expense', categoryId: 'groceries', amount: 39000, necessity: 'essential' };
const optional: Transaction = { ...essential, id: '8f243647-0c86-4c18-a6d4-54912c42b02a', date: '2026-12-03', categoryId: 'snacksDrinks', amount: 8250, necessity: 'optional' };
const report: SavedReport = { id: 'c8d0c301-8c9b-46cf-829f-bd1c56c98c20', month: '2026-12', pdfUri: 'file:///report.pdf', excelUri: 'file:///report.xlsx', revision: 3, createdAt: '2026-12-31T00:00:00.000Z', closed: false };
const state: Ledger = { version: 1, activeMonth: '2026-12', revision: 3, transactions: [income, essential, optional], reports: [report] };
const form = { date: '2026-12-02', type: 'expense' as const, categoryId: 'foodDining', amount: '12.50', description: '', necessity: 'essential' as const };

describe('money and filtering', () => {
  it('calculates all five totals', () => expect(summarize(state.transactions)).toEqual({ income: 80000, expense: 47250, balance: 32750, essential: 39000, optional: 8250 }));
  it('handles empty data and cents without floating point drift', () => {
    expect(summarize([]).balance).toBe(0);
    expect(summarize([{ ...income, amount: 0.1 }, { ...income, amount: 0.2 }]).income).toBe(0.3);
    expect(summarize([essential]).balance).toBe(-39000);
  });
  it('filters by full year-month, type and category, newest first', () => {
    expect(filterTransactions([...state.transactions, { ...income, date: '2025-12-30' }], '2026-12').map(item => item.id)).toEqual([optional.id, essential.id, income.id]);
    expect(filterTransactions(state.transactions, '2026-12', 'expense', 'groceries')).toEqual([essential]);
    expect(filterTransactions(state.transactions, '2027-01')).toEqual([]);
  });
});
describe('calendar rules', () => {
  it('uses local calendar dates and full years', () => {
    expect(localDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
    expect(currentMonth(new Date(2027, 0, 1))).toBe('2027-01');
    expect(isPreviousMonth('2026-12', new Date(2027, 0, 1))).toBe(true);
    expect(isPreviousMonth('2027-02', new Date(2027, 0, 1))).toBe(false);
    expect(nextMonth('2026-12')).toBe('2027-01');
  });
  it('rejects impossible dates and respects leap years', () => {
    expect(validDate('2026-02-29')).toBe(false);
    expect(validDate('2028-02-29')).toBe(true);
    expect(validDate('2026-04-31')).toBe(false);
    expect(validDate('2026-13-01')).toBe(false);
    expect(validDate('2026-1-1')).toBe(false);
  });
  it('closes only at month end or later', () => {
    expect(canClose('2026-12', new Date(2026, 11, 30))).toBe(false);
    expect(canClose('2026-12', new Date(2026, 11, 31))).toBe(true);
    expect(canClose('2026-12', new Date(2027, 0, 1))).toBe(true);
    expect(canClose('2027-02', new Date(2027, 0, 1))).toBe(false);
    expect(canClose('2028-02', new Date(2028, 1, 28))).toBe(false);
    expect(canClose('2028-02', new Date(2028, 1, 29))).toBe(true);
  });
});
describe('entry validation', () => {
  const schema = transactionSchema('2026-12', '2026-12-15');
  it('accepts decimal amounts and optional email', () => {
    expect(schema.safeParse(form).success).toBe(true);
    expect(emailSchema.safeParse({ email: '' }).success).toBe(true);
    expect(emailSchema.safeParse({ email: 'invalid' }).success).toBe(false);
  });
  it.each(['0', '-1', 'NaN', 'Infinity', '1.234', '1e3', '', '1000000000'])('rejects invalid amount %s', amount => expect(schema.safeParse({ ...form, amount }).success).toBe(false));
  it.each(['2026-12-16', '2026-11-30', '2025-12-02', '2026-12-32'])('rejects invalid or inactive date %s', date => expect(schema.safeParse({ ...form, date }).success).toBe(false));
  it('requires expense necessity and type-matched categories', () => {
    expect(schema.safeParse({ ...form, necessity: undefined }).success).toBe(false);
    expect(schema.safeParse({ ...form, categoryId: 'salary' }).success).toBe(false);
    expect(schema.safeParse({ ...form, type: 'income', categoryId: 'salary', necessity: undefined }).success).toBe(true);
    expect(schema.safeParse({ ...form, description: 'x'.repeat(501) }).success).toBe(false);
  });
});
describe('safe closure and stored data', () => {
  it('clears transactions and retains reports in one new state', () => {
    const closed = closeLedger(state, report, new Date(2027, 0, 1));
    expect(closed.activeMonth).toBe('2027-01');
    expect(closed.transactions).toEqual([]);
    expect(closed.reports[0]?.closed).toBe(true);
    expect(state.transactions).toHaveLength(3);
  });
  it('advances to the current month after a long absence', () => expect(closeLedger(state, report, new Date(2027, 5, 1)).activeMonth).toBe('2027-06'));
  it('rejects early closure, stale reports, missing reports, and duplicate closure', () => {
    expect(() => closeLedger(state, report, new Date(2026, 11, 1))).toThrow('errors.closeTooEarly');
    expect(() => closeLedger({ ...state, revision: 4 }, report, new Date(2027, 0, 1))).toThrow('errors.staleReport');
    expect(() => closeLedger({ ...state, reports: [] }, report, new Date(2027, 0, 1))).toThrow();
    expect(() => closeLedger(state, { ...report, closed: true }, new Date(2027, 0, 1))).toThrow();
  });
  it('rejects corrupt persisted data without substituting defaults', () => {
    expect(ledgerSchema.safeParse(state).success).toBe(true);
    for (const bad of [{ ...income, amount: -1 }, { ...income, date: '2027-01-01' }, { ...income, categoryId: 'missing' }, { ...essential, necessity: undefined }]) {
      expect(ledgerSchema.safeParse({ ...state, transactions: [bad] }).success).toBe(false);
    }
    expect(ledgerSchema.safeParse({ ...state, version: 99 }).success).toBe(false);
    expect(ledgerSchema.safeParse({ ...state, transactions: [income, income] }).success).toBe(false);
  });
});
it('has matching English and Bangla translation keys', () => {
  function keys(value: object, prefix = ''): string[] {
    return Object.entries(value).flatMap(([key, entry]) => typeof entry === 'object' && entry !== null ? keys(entry, `${prefix}${key}.`) : [`${prefix}${key}`]);
  }
  expect(keys(bn).sort()).toEqual(keys(en).sort());
});
