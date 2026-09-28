export function currency(amount: number, language = 'en'): string {
  return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-BD', {
    style: 'currency', currency: 'BDT', maximumFractionDigits: 2,
  }).format(amount);
}
