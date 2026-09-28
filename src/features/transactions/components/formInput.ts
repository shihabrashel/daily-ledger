import { localDate, nextMonth, validDate } from '@/utils/date';

export function datePickerBounds(month: string, now = new Date()) {
  const minimumDate = new Date(`${month}-01T12:00:00`);
  const monthEnd = new Date(`${nextMonth(month)}-01T12:00:00`);
  monthEnd.setDate(0);
  const today = new Date(`${localDate(now)}T12:00:00`);
  return { minimumDate, maximumDate: today < monthEnd ? today : monthEnd };
}

export function selectedPickerDate(value: Date, month: string, now = new Date()): string | undefined {
  const date = localDate(value);
  return validDate(date) && date.startsWith(`${month}-`) && date <= localDate(now) ? date : undefined;
}

// Accept unfinished decimals while typing; Zod still validates the final amount.
export function amountInput(text: string): string | undefined {
  const normalized = text.replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6)).replace(/,/g, '.');
  if (!/^\d{0,9}(\.\d{0,2})?$/.test(normalized)) return undefined;
  return normalized.startsWith('.') ? `0${normalized}` : normalized;
}
