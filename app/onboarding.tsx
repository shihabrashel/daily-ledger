import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, Label, Screen } from '@/components/ui';
import { PreferencesForm } from '@/features/settings/PreferencesForm';
import { useApp } from '@/storage/AppProvider';
export default function Onboarding() {
  const { t } = useTranslation();
  const { settings } = useApp();
  if (settings.onboardingCompleted) return <Redirect href="/(tabs)" />;
  return <Screen keyboardAvoiding><Label bold size={22}>{t('appName')}</Label><Label muted>{t('tagline')}</Label>
    <Label bold size={34}>{t('welcome')}</Label><Label>{t('intro')}</Label>
    <Card><PreferencesForm onboarding /></Card><Label muted>{t('localNote')}</Label></Screen>;
}
