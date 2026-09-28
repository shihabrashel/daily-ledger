import { z } from 'zod';
import { validDate } from '@/utils/date';
import { categoriesFor } from '@/constants/categories';

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const transaction = z.object({
  id: z.string().uuid(), date: z.string().refine(validDate), type: z.enum(['income', 'expense']),
  categoryId: z.string(), amount: z.number().positive().max(999999999.99)
    .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.0001),
  description: z.string().max(500).optional(), necessity: z.enum(['essential', 'optional']).optional(),
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime().optional(),
}).refine(item => categoriesFor(item.type).includes(item.categoryId))
  .refine(item => item.type === 'expense' ? Boolean(item.necessity) : !item.necessity);

export const settingsSchema = z.object({
  email: z.union([z.literal(''), z.email()]), language: z.enum(['en', 'bn']),
  theme: z.enum(['system', 'light', 'dark']), onboardingCompleted: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;
export const defaultSettings: Settings = { email: '', language: 'en', theme: 'system', onboardingCompleted: false };

export const reportSchema = z.object({
  id: z.string().uuid(), month, pdfUri: z.string().min(1), excelUri: z.string().min(1),
  revision: z.number().int().nonnegative(), createdAt: z.iso.datetime(), closed: z.boolean(),
});
export type SavedReport = z.infer<typeof reportSchema>;
export const ledgerSchema = z.object({
  version: z.literal(1), activeMonth: month, revision: z.number().int().nonnegative(),
  transactions: z.array(transaction), reports: z.array(reportSchema),
}).superRefine((state, ctx) => {
  if (state.transactions.some(item => item.date.slice(0, 7) !== state.activeMonth)) ctx.addIssue({ code: 'custom', message: 'Mixed transaction months' });
  if (new Set(state.transactions.map(item => item.id)).size !== state.transactions.length) ctx.addIssue({ code: 'custom', message: 'Duplicate transaction IDs' });
});
export type Ledger = z.infer<typeof ledgerSchema>;
