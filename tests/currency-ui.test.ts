import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { CurrencyCode } from '@/constants/currencies';
import { currency } from '@/utils/currency';
import { Summary } from '@/features/dashboard/Summary';
import { TransactionRow } from '@/features/transactions/components/TransactionRow';
import '@/localization';

const preference = vi.hoisted(() => ({ currency: 'BDT' as CurrencyCode }));
vi.mock('@/storage/AppProvider', () => ({ useApp: () => ({ settings: preference }) }));
vi.mock('@/theme', () => ({ useTheme: () => ({ colors: {} }) }));
vi.mock('expo-router', () => ({ router: { push: vi.fn() } }));
vi.mock('react-native', async () => {
  const { createElement } = await import('react');
  const Primitive = ({ children }: { children?: ReactNode }) => createElement('span', null, children);
  return { Text: Primitive, View: Primitive, Pressable: Primitive };
});
vi.mock('@/components/ui', async () => {
  const { createElement } = await import('react');
  const Primitive = ({ children }: { children?: ReactNode }) => createElement('span', null, children);
  return { Card: Primitive, Label: Primitive };
});

it.each(['BDT', 'USD'] as const)('renders dashboard and recent/list rows using the saved %s preference', code => {
  preference.currency = code;
  const item = { id: 'test', date: '2026-09-02', type: 'income' as const, categoryId: 'salary', amount: 2500, createdAt: '2026-09-02T00:00:00.000Z' };
  const summary = renderToStaticMarkup(createElement(Summary, { transactions: [item] }));
  const row = renderToStaticMarkup(createElement(TransactionRow, { item }));
  expect(summary).toContain(currency(item.amount, code));
  expect(row).toContain(currency(item.amount, code));
  expect(item.amount).toBe(2500);
});
