import type { Ledger, SavedReport } from '@/storage/models';
import { currentMonth, localDate, nextMonth } from '@/utils/date';

export function canClose(month: string, now = new Date()): boolean {
  const current = currentMonth(now);
  return month < current || (month === current && localDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)) === localDate(now));
}

export function closeLedger(state: Ledger, report: SavedReport, now = new Date()): Ledger {
  if (!canClose(state.activeMonth, now)) throw new Error('errors.closeTooEarly');
  if (report.closed || report.month !== state.activeMonth || report.revision !== state.revision || !state.reports.some(item => item.id === report.id)) {
    throw new Error('errors.staleReport');
  }
  return {
    ...state, activeMonth: state.activeMonth < currentMonth(now) ? currentMonth(now) : nextMonth(state.activeMonth),
    transactions: [], revision: state.revision + 1,
    reports: state.reports.map(item => item.id === report.id ? { ...item, closed: true } : item),
  };
}
