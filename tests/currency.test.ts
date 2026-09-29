import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { currency, currencyExcelFormat, currencyLabel } from '@/utils/currency';
import { CURRENCY_CODES, currencyChangeNeedsConfirmation } from '@/constants/currencies';
import { defaultSettings, settingsSchema } from '@/storage/models';
import { reportContent } from '@/features/reports/content';
import i18n from '@/localization';

describe('currency preference and formatting', () => {
  it('defaults old and new settings to BDT and rejects unsupported codes', () => {
    expect(defaultSettings.currency).toBe('BDT');
    const { currency: _currency, ...legacy } = defaultSettings;
    expect(settingsSchema.parse(legacy).currency).toBe('BDT');
    expect(settingsSchema.safeParse({ ...legacy, currency: 'EUR' }).success).toBe(false);
  });
  it('formats both currencies, cents, zero and negative balances', () => {
    expect(currency(2500, 'BDT')).toBe('৳2,500');
    expect(currency(2500.25, 'BDT')).toBe('৳2,500.25');
    expect(currency(2500, 'USD')).toBe('$2,500.00');
    expect(currency(0, 'USD')).toBe('$0.00');
    expect(currency(-12.5, 'USD')).toBe('-$12.50');
    expect(currency(2500, 'BDT', 'bn')).toContain('২,৫০০');
    expect(currency(2500, 'USD', 'bn')).toContain('২,৫০০.০০');
    expect(currencyLabel('USD')).toBe('USD ($)');
  });
  it('requires confirmation only for a real currency change with existing amounts', () => {
    expect(currencyChangeNeedsConfirmation('BDT', 'USD', 1)).toBe(true);
    expect(currencyChangeNeedsConfirmation('USD', 'BDT', 1)).toBe(true);
    expect(currencyChangeNeedsConfirmation('USD', 'USD', 1)).toBe(false);
    expect(currencyChangeNeedsConfirmation('BDT', 'USD', 0)).toBe(false);
  });
});

describe('currency report snapshots', () => {
  it.each(CURRENCY_CODES)('uses %s in PDF and Excel without changing amounts', code => {
    const items = [{ id: 'test', date: '2026-09-02', type: 'income' as const, categoryId: 'salary', amount: 2500, createdAt: '2026-09-02T00:00:00.000Z' }];
    const snapshot = structuredClone(items);
    const { html, workbook } = reportContent('2026-09', items, 'en', i18n.getFixedT('en'), code);
    expect(html).toContain(`Currency: ${currencyLabel(code)}`);
    expect(html).toContain(currency(2500, code));
    const reloaded = XLSX.read(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }), { type: 'array', cellNF: true });
    const sheet = reloaded.Sheets['Daily Ledger']!;
    expect(sheet.B2?.v).toBe(currencyLabel(code));
    expect(sheet.D10?.v).toBe(2500);
    expect(sheet.D10?.t).toBe('n');
    expect(sheet.D10?.z).toBe(currencyExcelFormat(code));
    expect(items).toEqual(snapshot);
  });
});
