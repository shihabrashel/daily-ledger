import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Choices, Label, Screen } from '@/components/ui';
import { useApp } from '@/storage/AppProvider';
import { TransactionRow } from '@/features/transactions/components/TransactionRow';
import { filterTransactions } from '@/features/transactions/services/calculations';
import { categoriesFor } from '@/constants/categories';
import { monthLabel } from '@/utils/date';
import { MonthNotice } from '@/features/dashboard/MonthNotice';
export default function Transactions() {
  const { ledger } = useApp();
  const { t, i18n } = useTranslation();
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [category, setCategory] = useState('');
  if (!ledger) return null;
  const items = filterTransactions(ledger.transactions, ledger.activeMonth, type === 'all' ? undefined : type, category);
  const categories = type === 'all' ? [...categoriesFor('income'), ...categoriesFor('expense')] : categoriesFor(type);
  return <Screen><Label bold size={30}>{t('transactions')}</Label><Label muted>{monthLabel(ledger.activeMonth, i18n.language)}</Label><MonthNotice />
    <Choices value={type} options={(['all', 'income', 'expense'] as const).map(value => ({ value, label: t(value) }))} onChange={value => { setType(value); setCategory(''); }} />
    <Choices value={category} options={[{ value: '', label: t('allCategories') }, ...categories.map(value => ({ value, label: t(`categories.${value}`) }))]} onChange={setCategory} />
    <Card>{items.length ? items.map(item => <TransactionRow key={item.id} item={item} />) : <Label muted>{t('noMatches')}</Label>}</Card>
  </Screen>;
}
