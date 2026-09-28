import type { Transaction, TransactionType } from '../types';

export function filterTransactions(items: Transaction[], month: string, type?: TransactionType, category?: string): Transaction[] {
  return items.filter(item => item.date.startsWith(`${month}-`) && (!type || item.type === type) && (!category || item.categoryId === category))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

export function summarize(items: Transaction[]) {
  const cents = { income: 0, expense: 0, essential: 0, optional: 0 };
  for (const item of items) {
    const amount = Math.round(item.amount * 100);
    cents[item.type] += amount;
    if (item.type === 'expense' && item.necessity) cents[item.necessity] += amount;
  }
  return {
    income: cents.income / 100, expense: cents.expense / 100,
    balance: (cents.income - cents.expense) / 100,
    essential: cents.essential / 100, optional: cents.optional / 100,
  };
}
