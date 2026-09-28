import { useState } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Label, Screen } from '@/components/ui';
import { useApp } from '@/storage/AppProvider';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { currency } from '@/utils/currency';
export default function TransactionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ledger, deleteTransaction, todayMonth } = useApp();
  const { t, i18n } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const item = ledger?.transactions.find(tx => tx.id === id);
  const remove = () => Alert.alert(t('delete'), t('deleteWarning'), [
    { text: t('cancel'), style: 'cancel' }, { text: t('delete'), style: 'destructive', onPress: () => {
      setBusy(true);
      void deleteTransaction(id).then(() => router.back()).catch(() => Alert.alert(t('errors.title'), t('errors.storage'))).finally(() => setBusy(false));
    } },
  ]);
  return <Screen><Label bold size={28}>{t(editing ? 'edit' : 'details')}</Label>
    {!item ? <Label>{t('errors.missing')}</Label> : editing ? <TransactionForm transaction={item} /> : <>
      <Card><Label muted>{item.date} · {t(item.type)}</Label><Label bold size={30}>{currency(item.amount, i18n.language)}</Label>
        <Label bold>{t(`categories.${item.categoryId}`)}</Label>{item.necessity && <Label>{t(item.necessity)}</Label>}{item.description && <Label>{item.description}</Label>}</Card>
      <Button title={t('edit')} disabled={busy || !ledger || ledger.activeMonth > todayMonth} onPress={() => setEditing(true)} />
      <Button danger title={t('delete')} disabled={busy} onPress={remove} />
    </>}
    {!editing && <Button secondary title={t('cancel')} onPress={() => router.back()} />}
  </Screen>;
}
