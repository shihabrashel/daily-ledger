import { describe, expect, it } from 'vitest';
import { amountInput, datePickerBounds, selectedPickerDate } from '@/features/transactions/components/formInput';
import { localDate } from '@/utils/date';
import { transactionSchema } from '@/features/transactions/validation/transaction';

describe('native calendar boundaries', () => {
  it('limits the current month to today, using local calendar dates', () => {
    const bounds = datePickerBounds('2026-09', new Date(2026, 8, 28, 23, 59));
    expect(localDate(bounds.minimumDate)).toBe('2026-09-01');
    expect(localDate(bounds.maximumDate)).toBe('2026-09-28');
  });
  it('permits editing the whole previous open month across a year boundary', () => {
    const bounds = datePickerBounds('2026-12', new Date(2027, 0, 5));
    expect(localDate(bounds.minimumDate)).toBe('2026-12-01');
    expect(localDate(bounds.maximumDate)).toBe('2026-12-31');
  });
  it.each([[2026, '2026-02-28'], [2028, '2028-02-29']] as const)('handles February in %i', (year, end) => {
    expect(localDate(datePickerBounds(`${year}-02`, new Date(year, 2, 1)).maximumDate)).toBe(end);
  });
  it('has no selectable dates when the open month is in the future', () => {
    const bounds = datePickerBounds('2027-01', new Date(2026, 11, 31));
    expect(bounds.minimumDate > bounds.maximumDate).toBe(true);
  });
  it('keeps the persisted YYYY-MM-DD format and rechecks the selection', () => {
    const today = new Date(2027, 0, 5);
    expect(selectedPickerDate(new Date(2026, 11, 31, 23), '2026-12', today)).toBe('2026-12-31');
    expect(selectedPickerDate(new Date(2027, 0, 1), '2026-12', today)).toBeUndefined();
    expect(selectedPickerDate(new Date(2027, 0, 6), '2027-01', today)).toBeUndefined();
    expect(selectedPickerDate(new Date('invalid'), '2027-01', today)).toBeUndefined();
  });
});

describe('amount keyboard input', () => {
  it.each(['', '12', '12.', '12.50', '999999999.99'])('allows editing %s', value => expect(amountInput(value)).toBe(value));
  it('normalizes Bangla digits and decimal keyboards without storing a symbol', () => {
    expect(amountInput('১২.৫০')).toBe('12.50');
    expect(amountInput('12,50')).toBe('12.50');
    expect(amountInput('.5')).toBe('0.5');
  });
  it.each(['-12', '1e3', '12.345', '1.2.3', '৳12', 'NaN', '1000000000', '1,234.50'])('rejects %s without replacing the previous input', value => expect(amountInput(value)).toBeUndefined());
  it('still requires a positive complete amount at submit', () => {
    const schema = transactionSchema('2026-09', '2026-09-28');
    const entry = { date: '2026-09-28', type: 'income', categoryId: 'salary', description: '' };
    expect(schema.safeParse({ ...entry, amount: amountInput('০') }).success).toBe(false);
    expect(schema.safeParse({ ...entry, amount: amountInput('12.') }).success).toBe(false);
    expect(schema.safeParse({ ...entry, amount: amountInput('১২.৫০') }).success).toBe(true);
  });
});
