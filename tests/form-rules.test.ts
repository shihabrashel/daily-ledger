import { describe, expect, it } from 'vitest';
import { categoriesFor } from '@/constants/categories';
import { selectionForType } from '@/features/transactions/services/formRules';
import { AppError, controlledError, userErrorKey } from '@/utils/errors';

describe('transaction type transitions', () => {
  it('uses distinct centralized lists', () => {
    expect(categoriesFor('expense')).toContain('groceries');
    expect(categoriesFor('expense')).not.toContain('salary');
    expect(categoriesFor('income')).toContain('salary');
    expect(categoriesFor('income')).not.toContain('groceries');
  });
  it('clears incompatible categories in both directions', () => {
    expect(selectionForType('income', 'foodDining', 'essential')).toEqual({ categoryId: '', necessity: undefined });
    expect(selectionForType('expense', 'salary', undefined)).toEqual({ categoryId: '', necessity: undefined });
  });
  it('preserves compatible categories and expense necessity, but ignores income necessity', () => {
    expect(selectionForType('expense', 'foodDining', 'optional')).toEqual({ categoryId: 'foodDining', necessity: 'optional' });
    expect(selectionForType('income', 'salary', 'essential')).toEqual({ categoryId: 'salary', necessity: undefined });
  });
});

describe('controlled errors', () => {
  it('never exposes native messages, paths, or unknown translation keys', () => {
    for (const message of ['Missing READ permission: F:/private/file', 'errors.node_modules/secret']) {
      const result = controlledError(new Error(message), 'errors.report');
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('errors.report');
      expect(userErrorKey(new Error(message), 'errors.storage')).toBe('errors.storage');
    }
  });
  it('preserves actionable known business errors', () => {
    expect(controlledError(new Error('errors.staleReport'), 'errors.report').key).toBe('errors.staleReport');
  });
});
