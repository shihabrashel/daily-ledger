export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function currentMonth(now = new Date()): string {
  return localDate(now).slice(0, 7);
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}

export function nextMonth(month: string): string {
  const [year, number] = month.split('-').map(Number);
  return currentMonth(new Date(year!, number!, 1));
}

export function isPreviousMonth(month: string, now = new Date()): boolean {
  return month < currentMonth(now);
}

export function monthLabel(month: string, language: string): string {
  return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-GB', {
    month: 'long', year: 'numeric',
  }).format(new Date(`${month}-01T12:00:00`));
}
