import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Label, Screen } from '@/components/ui';
import { useApp } from '@/storage/AppProvider';
import { Summary } from '@/features/dashboard/Summary';
import { MonthNotice } from '@/features/dashboard/MonthNotice';
import { TransactionRow } from '@/features/transactions/components/TransactionRow';
import { filterTransactions } from '@/features/transactions/services/calculations';
import { monthLabel } from '@/utils/date';

export default function Dashboard() {
  const { ledger, todayMonth } = useApp();
  const { t, i18n } = useTranslation();
  if (!ledger) return null;
  const transactions = filterTransactions(ledger.transactions, todayMonth);
  return <Screen><Label muted>{t('appName')}</Label><Label bold size={30}>{monthLabel(todayMonth, i18n.language)}</Label>
    <MonthNotice /><Summary transactions={transactions} />
    <Button title={t('add')} disabled={ledger.activeMonth !== todayMonth} onPress={() => router.push('/transaction/new')} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}><Label bold size={20}>{t('recent')}</Label><Button secondary title={t('viewAll')} onPress={() => router.push('/(tabs)/transactions')} /></View>
    <Card>{transactions.length ? transactions.slice(0, 10).map(item => <TransactionRow key={item.id} item={item} />) : <><Label bold>{t('empty')}</Label><Label muted>{t('emptyHint')}</Label></>}</Card>
  </Screen>;
}
