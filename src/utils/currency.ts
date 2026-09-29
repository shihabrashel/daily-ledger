import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES, type CurrencyCode } from '@/constants/currencies';

export function currency(amount: number, code: CurrencyCode = DEFAULT_CURRENCY, language = 'en'): string {
  return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-BD', {
    style: 'currency', currency: code, currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: SUPPORTED_CURRENCIES[code].minimumFractionDigits, maximumFractionDigits: 2,
  }).format(amount);
}

export function currencyLabel(code: CurrencyCode): string {
  return `${code} (${SUPPORTED_CURRENCIES[code].symbol})`;
}

export function currencyExcelFormat(code: CurrencyCode): string {
  return `"${SUPPORTED_CURRENCIES[code].symbol}"#,##0.00`;
}
