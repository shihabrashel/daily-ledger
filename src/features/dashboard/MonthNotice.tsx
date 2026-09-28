import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Label } from '@/components/ui';
import { useApp } from '@/storage/AppProvider';
import { monthLabel } from '@/utils/date';
export function MonthNotice() {
  const { ledger, todayMonth } = useApp();
  const { t, i18n } = useTranslation();
  if (!ledger || ledger.activeMonth === todayMonth) return null;
  const month = monthLabel(ledger.activeMonth, i18n.language);
  return <Card>{ledger.activeMonth < todayMonth ? <><Label bold>{t('stillOpen', { month })}</Label><Label>{t('mustClose', { month: monthLabel(todayMonth, i18n.language) })}</Label><Button title={t('close', { month })} onPress={() => router.push('/(tabs)/reports')} /></> : <Label>{t('nextMonth', { month })}</Label>}</Card>;
}
