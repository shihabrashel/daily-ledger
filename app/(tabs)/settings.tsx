import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Label, Screen } from '@/components/ui';
import { PreferencesForm } from '@/features/settings/PreferencesForm';
import Constants from 'expo-constants';
export default function Settings() {
  const { t } = useTranslation();
  return <Screen><Label bold size={30}>{t('settings')}</Label><Card><PreferencesForm /></Card>
    <Card><Label bold>{t('reports')}</Label><Label muted>{t('reportHint')}</Label><Button secondary title={t('retained')} onPress={() => router.push('/(tabs)/reports')} /></Card>
    <Card><Label bold>{t('about')}</Label><Label>{t('appName')}</Label><Label muted>{t('version', { version: Constants.expoConfig?.version ?? '1.0.0' })}</Label><Label muted>{t('localNote')}</Label></Card></Screen>;
}
