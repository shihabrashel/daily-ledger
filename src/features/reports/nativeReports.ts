import { Directory, File, Paths } from 'expo-file-system';
import { printToFileAsync } from 'expo-print';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { randomUUID } from 'expo-crypto';
import * as XLSX from 'xlsx';
import i18n from '@/localization';
import { ledgerSchema } from '@/storage/models';
import { reportContent } from './content';
import { ReportService } from './ReportService';

export const reportService = new ReportService({
  async create(month, state, language) {
    ledgerSchema.parse(state);
    if (state.activeMonth !== month) throw new Error('errors.staleReport');
    const id = randomUUID();
    const directory = new Directory(Paths.document, 'reports');
    directory.create({ idempotent: true, intermediates: true });
    const { html, workbook } = reportContent(month, state.transactions, language, i18n.getFixedT(language));
    const pdfResult = await printToFileAsync({ html, width: 842, height: 595 });
    const pdf = new File(directory, `DailyLedger-${month}-${id}.pdf`);
    new File(pdfResult.uri).copy(pdf);
    const excel = new File(directory, `DailyLedger-${month}-${id}.xlsx`);
    const bytes: ArrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    excel.create();
    excel.write(new Uint8Array(bytes));
    return { id, month, pdfUri: pdf.uri, excelUri: excel.uri, revision: state.revision, createdAt: new Date().toISOString(), closed: false };
  },
  async verify(report) {
    const pdf = new File(report.pdfUri);
    const excel = new File(report.excelUri);
    if (!pdf.exists || !excel.exists || pdf.size <= 5 || excel.size <= 4) throw new Error('errors.report');
    const [pdfBytes, excelBytes] = await Promise.all([pdf.bytes(), excel.bytes()]);
    if (String.fromCharCode(...pdfBytes.slice(0, 5)) !== '%PDF-' || excelBytes[0] !== 0x50 || excelBytes[1] !== 0x4b) throw new Error('errors.report');
    const workbook = XLSX.read(excelBytes, { type: 'array' });
    if (!workbook.SheetNames.includes('DailyLedger')) throw new Error('errors.report');
  },
  async share(uri, format) {
    if (!new File(uri).exists || !await isAvailableAsync()) throw new Error('errors.share');
    await shareAsync(uri, { mimeType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', UTI: format === 'pdf' ? 'com.adobe.pdf' : 'org.openxmlformats.spreadsheetml.sheet' });
  },
});
