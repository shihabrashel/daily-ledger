import type { Ledger, SavedReport } from '@/storage/models';
import { controlledError } from '@/utils/errors';

export interface ReportFiles {
  create(month: string, state: Ledger, language: string): Promise<SavedReport>;
  verify(report: SavedReport): Promise<void>;
  share(uri: string, format: 'pdf' | 'xlsx'): Promise<void>;
}

export class ReportService {
  constructor(private readonly files: ReportFiles) {}
  async generate(state: Ledger, language: string, retain: (report: SavedReport) => Promise<void>) {
    try {
      const report = await this.files.create(state.activeMonth, state, language);
      await this.files.verify(report);
      await retain(report);
      return report;
    } catch (error) { throw controlledError(error, 'errors.report'); }
  }
  async verify(report: SavedReport) {
    try { await this.files.verify(report); }
    catch (error) { throw controlledError(error, 'errors.report'); }
  }
  async share(uri: string, format: 'pdf' | 'xlsx') {
    try { await this.files.share(uri, format); }
    catch (error) { throw controlledError(error, 'errors.share'); }
  }
}
