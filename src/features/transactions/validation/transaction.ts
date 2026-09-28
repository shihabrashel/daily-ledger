import { z } from 'zod';
import { categoriesFor } from '@/constants/categories';
import { localDate, validDate } from '@/utils/date';

export function transactionSchema(month: string, today = localDate()) {
  return z.object({
    date: z.string().refine(validDate, 'validation.date').refine(date => date <= today, 'validation.future')
      .refine(date => date.slice(0, 7) === month, 'validation.month'),
    type: z.enum(['income', 'expense']),
    categoryId: z.string().min(1, 'validation.category'),
    amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, 'validation.amount')
      .refine(value => Number(value) > 0 && Number(value) <= 999999999.99, 'validation.amount'),
    description: z.string().max(500, 'validation.description'),
    necessity: z.enum(['essential', 'optional']).optional(),
  }).superRefine((data, context) => {
    if (!categoriesFor(data.type).includes(data.categoryId)) context.addIssue({ code: 'custom', path: ['categoryId'], message: 'validation.category' });
    if (data.type === 'expense' && !data.necessity) context.addIssue({ code: 'custom', path: ['necessity'], message: 'validation.necessity' });
  });
}
export type TransactionForm = z.infer<ReturnType<typeof transactionSchema>>;
export const emailSchema = z.object({ email: z.union([z.literal(''), z.email('validation.email')]) });
