import type { TFunction } from 'i18next';
import * as XLSX from 'xlsx';
import type { Transaction } from '@/features/transactions/types';
import { summarize } from '@/features/transactions/services/calculations';
import { monthLabel } from '@/utils/date';
import { currency, currencyLabel, currencyExcelFormat } from '@/utils/currency';
import { DEFAULT_CURRENCY, type CurrencyCode } from '@/constants/currencies';
import { categoryTranslationKey } from '@/constants/categories';

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

export function reportContent(month: string, items: Transaction[], language: string, t: TFunction, code: CurrencyCode = DEFAULT_CURRENCY) {
  const summary = summarize(items);
  const title = monthLabel(month, language);
  const summaryRows = [
    [t('totalIncome'), summary.income], [t('totalExpense'), summary.expense], [t('balance'), summary.balance],
    [t('essentialExpense'), summary.essential], [t('optionalExpense'), summary.optional],
  ] satisfies [string, number][];
  const headers = ['date', 'category', 'expense', 'income', 'description', 'necessity'].map(key => t(key));
  const rows = [...items].sort((a, b) => a.date.localeCompare(b.date)).map(item => [
    item.date, t(categoryTranslationKey(item.categoryId, item.type)), item.type === 'expense' ? item.amount : '',
    item.type === 'income' ? item.amount : '', item.description ?? '', item.necessity ? t(item.necessity) : '',
  ]);
  const totals = [t('total'), '', summary.expense, summary.income, '', ''];
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Daily Ledger', title], [t('currencySettings.label'), currencyLabel(code)], ...summaryRows, [], headers, ...rows, totals, [t('balance'), summary.balance],
  ]);
  sheet['!cols'] = [18, 26, 20, 20, 48, 22].map(wch => ({ wch }));
  for (const key of Object.keys(sheet)) {
    const cell = sheet[key];
    if (!key.startsWith('!') && cell?.t === 'n') cell.z = currencyExcelFormat(code);
  }
  // aoa_to_sheet keeps descriptions as string cells, including text beginning with '='.
  XLSX.utils.book_append_sheet(workbook, sheet, 'Daily Ledger');
  const htmlRow = (row: (string | number)[], tag = 'td') => `<tr>${row.map(value => `<${tag}>${escapeHtml(typeof value === 'number' ? currency(value, code, language) : value)}</${tag}>`).join('')}</tr>`;
  const html = `<!doctype html><html lang="${language === 'bn' ? 'bn' : 'en'}"><head><meta charset="utf-8"><style>
    @page { margin: 28px; } body { font-family: sans-serif; color: #172B26; font-size: 11px; }
    h1 { font-size: 26px; color: #176B50; } h2 { font-size: 18px; } table { border-collapse: collapse; width: 100%; margin: 20px 0; table-layout: fixed; }
    th, td { border-bottom: 1px solid #D8E1DC; padding: 9px 5px; text-align: left; overflow-wrap: anywhere; }
    th { background: #E4F0E9; } thead { display: table-header-group; } tr { break-inside: avoid; } .summary { width: 70%; }
    </style></head><body><h1>Daily Ledger</h1><h2>${escapeHtml(t('summary', { month: title }))}</h2>
    <p>${escapeHtml(t('currencySettings.label'))}: ${escapeHtml(currencyLabel(code))}</p>
    <table class="summary">${summaryRows.map(row => htmlRow(row)).join('')}</table>
    <table><thead>${htmlRow(headers, 'th')}</thead><tbody>${rows.map(row => htmlRow(row)).join('')}${htmlRow(totals, 'th')}</tbody></table>
    <p>${escapeHtml(t('balance'))}: ${escapeHtml(currency(summary.balance, code, language))}</p></body></html>`;
  return { html, workbook };
}
