import { z } from 'zod';
import { normalizeExpenseCategory } from '@/constants/categories';
import { ledgerSchema } from './models';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrateExpenseCategories(value: unknown): unknown {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.transactions)) return value;
  let changed = false;
  const transactions = value.transactions.map((item: unknown) => {
    if (!isRecord(item) || item.type !== 'expense' || typeof item.categoryId !== 'string') return item;
    const categoryId = normalizeExpenseCategory(item.categoryId);
    if (categoryId === item.categoryId) return item;
    changed = true;
    return { ...item, categoryId };
  });
  if (!changed) return value;
  // Report snapshots remain available, but changed categories require a fresh closing report.
  const revision = typeof value.revision === 'number' && Number.isSafeInteger(value.revision) && value.revision >= 0
    ? value.revision + 1 : value.revision;
  return { ...value, transactions, revision };
}

// Map only at the read boundary. Writes still enforce the current category IDs.
// The next normal ledger write persists this mapping; failed reads never overwrite source data.
export const storedLedgerSchema = z.preprocess(migrateExpenseCategories, ledgerSchema);
