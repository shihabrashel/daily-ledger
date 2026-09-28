import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Label } from '@/components/ui';
import { summarize } from '@/features/transactions/services/calculations';
import type { Transaction } from '@/features/transactions/types';
import { currency } from '@/utils/currency';
import { useTheme } from '@/theme';

export function Summary({ transactions }: { transactions: Transaction[] }) {
  const totals = summarize(transactions);
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  return <><Card><Label muted>{t('balance')}</Label><Label bold size={36}>{currency(totals.balance, i18n.language)}</Label>
    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
    <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
      <View style={{ flex: 1, minWidth: 120 }}><Label muted>{t('totalIncome')}</Label><Label bold size={20}>{currency(totals.income, i18n.language)}</Label></View>
      <View style={{ flex: 1, minWidth: 120 }}><Label muted>{t('totalExpense')}</Label><Label bold size={20}>{currency(totals.expense, i18n.language)}</Label></View>
    </View></Card>
    <Card>{(['essential', 'optional'] as const).map(key => <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}><Label muted>{t(`${key}Expense`)}</Label><Label bold>{currency(totals[key], i18n.language)}</Label></View>)}</Card></>;
}
