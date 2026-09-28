import type { Ledger, SavedReport } from '@/storage/models';

export interface ReportFiles {
  create(month: string, state: Ledger, language: string): Promise<SavedReport>;
  verify(report: SavedReport): Promise<void>;
  share(uri: string, format: 'pdf' | 'xlsx'): Promise<void>;
}

export class ReportService {
  constructor(private readonly files: ReportFiles) {}
  async generate(state: Ledger, language: string, retain: (report: SavedReport) => Promise<void>) {
    const report = await this.files.create(state.activeMonth, state, language);
    await this.files.verify(report);
    await retain(report);
    return report;
  }
  verify(report: SavedReport) { return this.files.verify(report); }
  share(uri: string, format: 'pdf' | 'xlsx') { return this.files.share(uri, format); }
}
