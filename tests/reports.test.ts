import { describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import i18n from '@/localization';
import { reportContent } from '@/features/reports/content';
import { ReportService, type ReportFiles } from '@/features/reports/ReportService';
import type { Ledger, SavedReport } from '@/storage/models';

const state: Ledger = { version: 1, activeMonth: '2026-09', revision: 1, reports: [], transactions: [{ id: 'test', date: '2026-09-01', type: 'expense', amount: 12.5, categoryId: 'food', necessity: 'essential', description: '<script>alert(1)</script>', createdAt: '2026-09-01T00:00:00.000Z' }] };
const report: SavedReport = { id: 'report', month: state.activeMonth, revision: 1, pdfUri: 'file:///a.pdf', excelUri: 'file:///a.xlsx', createdAt: '2026-09-01T00:00:00.000Z', closed: false };

describe('report content', () => {
  it('escapes HTML and writes numeric expenses into the correct Excel column', () => {
    const { html, workbook } = reportContent(state.activeMonth, state.transactions, 'en', i18n.getFixedT('en'));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    const reloaded = XLSX.read(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(reloaded.Sheets['Daily Ledger']!, { header: 1 });
    expect(rows.find(row => row[0] === '2026-09-01')?.slice(2, 4)).toEqual([12.5, '']);
    expect(rows.find(row => row[0] === 'Total')?.slice(2, 4)).toEqual([12.5, 0]);
  });
  it('preserves Bangla and does not convert user descriptions into formulas', () => {
    const { html, workbook } = reportContent(state.activeMonth, [{ ...state.transactions[0]!, description: '=HYPERLINK("bad")' }], 'bn', i18n.getFixedT('bn'));
    expect(html).toContain('প্রয়োজনীয়');
    expect(workbook.Sheets['Daily Ledger']?.E10?.t).toBe('s');
    expect(workbook.Sheets['Daily Ledger']?.E10?.f).toBeUndefined();
  });
});
describe('report generation failures', () => {
  function setup() {
    const files: ReportFiles = { create: vi.fn().mockResolvedValue(report), verify: vi.fn().mockResolvedValue(undefined), share: vi.fn().mockResolvedValue(undefined) };
    return { files, service: new ReportService(files), retain: vi.fn().mockResolvedValue(undefined) };
  }
  it('retains only after both files verify', async () => {
    const { files, service, retain } = setup();
    await service.generate(state, 'en', retain);
    expect(files.verify).toHaveBeenCalledWith(report);
    expect(retain).toHaveBeenCalledWith(report);
    expect(state.transactions).toHaveLength(1);
  });
  it.each(['create', 'verify'] as const)('does not retain or clear transactions when %s fails', async method => {
    const { files, service, retain } = setup();
    vi.mocked(files[method]).mockRejectedValue(new Error('disk full'));
    await expect(service.generate(state, 'en', retain)).rejects.toThrow('errors.report');
    expect(retain).not.toHaveBeenCalled();
    expect(state.transactions).toHaveLength(1);
  });
  it('propagates persistence failure', async () => {
    const { service, retain } = setup();
    retain.mockRejectedValue(new Error('storage full'));
    await expect(service.generate(state, 'en', retain)).rejects.toThrow('errors.report');
    expect(state.transactions).toHaveLength(1);
  });
  it('propagates sharing failure without clearing anything', async () => {
    const { files, service } = setup();
    vi.mocked(files.share).mockRejectedValue(new Error('unavailable'));
    await expect(service.share(report.pdfUri, 'pdf')).rejects.toThrow();
    expect(state.transactions).toHaveLength(1);
  });
});
