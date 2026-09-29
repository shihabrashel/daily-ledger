export const CURRENCY_CODES = ['BDT', 'USD'] as const;
export type CurrencyCode = typeof CURRENCY_CODES[number];
export const DEFAULT_CURRENCY: CurrencyCode = 'BDT';
export const SUPPORTED_CURRENCIES = {
  BDT: { code: 'BDT', symbol: '৳', nameKey: 'currencies.BDT', minimumFractionDigits: 0 },
  USD: { code: 'USD', symbol: '$', nameKey: 'currencies.USD', minimumFractionDigits: 2 },
} as const;

export function currencyChangeNeedsConfirmation(current: CurrencyCode, next: CurrencyCode, transactionCount: number): boolean {
  return current !== next && transactionCount > 0;
}
