import { reportService } from '@/features/reports/nativeReports';
import { beforeEach, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import type { Ledger } from '@/storage/models';

const mocks = vi.hoisted(() => ({
  files: new Map<string, Uint8Array>(),
  print: vi.fn(), share: vi.fn(), available: vi.fn(),
}));
vi.mock('expo-print', () => ({ printToFileAsync: mocks.print }));
vi.mock('expo-crypto', () => ({ randomUUID: () => 'report-id' }));
vi.mock('expo-sharing', () => ({ isAvailableAsync: mocks.available, shareAsync: mocks.share }));
vi.mock('expo-file-system', () => ({
  Paths: { document: 'file:///app/documents' },
  Directory: class {
    uri: string;
    constructor(root: string, name: string) { this.uri = `${root}/${name}`; }
    create() {}
  },
  File: class {
    uri: string;
    constructor(root: string | { uri: string }, name?: string) {
      this.uri = `${typeof root === 'string' ? root : root.uri}${name ? '/' + name : ''}`;
      if (!this.uri.startsWith('file:///app/documents/')) throw new Error('Missing READ permission');
    }
    create() { mocks.files.set(this.uri, new Uint8Array()); }
    write(data: string | Uint8Array, options?: { encoding: string }) {
      mocks.files.set(this.uri, typeof data === 'string' ? new Uint8Array(Buffer.from(data, options?.encoding === 'base64' ? 'base64' : 'utf8')) : data);
    }
    get exists() { return mocks.files.has(this.uri); }
    get size() { return mocks.files.get(this.uri)?.length ?? 0; }
    async bytes() { return mocks.files.get(this.uri)!; }
  },
}));

const state: Ledger = { version: 1, activeMonth: '2026-09', revision: 0, transactions: [], reports: [] };

beforeEach(() => {
  mocks.files.clear(); vi.clearAllMocks();
  mocks.print.mockResolvedValue({ uri: 'file:///inaccessible/Print/file.pdf', base64: Buffer.from('%PDF-1.7\nreport').toString('base64') });
  mocks.available.mockResolvedValue(true);
});

it('writes PDF bytes and a real XLSX into owned storage without reading the print URI', async () => {
  const retain = vi.fn();
  const report = await reportService.generate(state, 'en', retain);
  expect(mocks.print).toHaveBeenCalledWith(expect.objectContaining({ base64: true }));
  expect(Buffer.from(mocks.files.get(report.pdfUri)!).toString()).toBe('%PDF-1.7\nreport');
  const workbook = XLSX.read(mocks.files.get(report.excelUri), { type: 'array' });
  expect(workbook.SheetNames).toContain('Daily Ledger');
  expect(retain).toHaveBeenCalledWith(report);
  await reportService.share(report.pdfUri, 'pdf');
  expect(mocks.share).toHaveBeenCalledWith(report.pdfUri, expect.objectContaining({ mimeType: 'application/pdf' }));
});

it('does not retain a report when Print returns no PDF data', async () => {
  mocks.print.mockResolvedValue({ uri: 'file:///inaccessible/Print/file.pdf' });
  const retain = vi.fn();
  await expect(reportService.generate(state, 'en', retain)).rejects.toThrow('errors.report');
  expect(retain).not.toHaveBeenCalled();
});

it('passes the selected currency through native PDF/Excel generation and retained metadata', async () => {
  const report = await reportService.generate(state, 'en', vi.fn(), 'USD');
  expect(report.currency).toBe('USD');
  expect(mocks.print).toHaveBeenCalledWith(expect.objectContaining({ html: expect.stringContaining('Currency: USD ($)') }));
  const workbook = XLSX.read(mocks.files.get(report.excelUri), { type: 'array' });
  expect(workbook.Sheets['Daily Ledger']?.B2?.v).toBe('USD ($)');
});

it('converts a native rejection to a controlled error', async () => {
  mocks.print.mockRejectedValue(new Error('native source path and stack'));
  await expect(reportService.generate(state, 'en', vi.fn())).rejects.toThrow('errors.report');
});

it('keeps older saved workbook names readable', async () => {
  const report = await reportService.generate(state, 'en', vi.fn());
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['old report']]), 'DailyLedger');
  mocks.files.set(report.excelUri, new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })));
  await expect(reportService.verify(report)).resolves.toBeUndefined();
});
