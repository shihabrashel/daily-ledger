import { categoriesFor } from '@/constants/categories';
import type { TransactionType, Transaction } from '../types';

export function selectionForType(type: TransactionType, categoryId: string, necessity: Transaction['necessity']) {
  return {
    categoryId: categoriesFor(type).includes(categoryId) ? categoryId : '',
    necessity: type === 'income' ? undefined : necessity,
  };
}
