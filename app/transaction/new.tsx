import { useTranslation } from 'react-i18next';
import { Redirect } from 'expo-router';
import { Label, Screen } from '@/components/ui';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { MonthNotice } from '@/features/dashboard/MonthNotice';
import { useApp } from '@/storage/AppProvider';
export default function NewTransaction() {
  const { t } = useTranslation();
  const { ledger, todayMonth, settings } = useApp();
  if (!settings.onboardingCompleted) return <Redirect href="/onboarding" />;
  return <Screen><Label bold size={28}>{t('add')}</Label>{ledger?.activeMonth === todayMonth ? <TransactionForm /> : <MonthNotice />}</Screen>;
}
