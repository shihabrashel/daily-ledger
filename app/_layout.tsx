import '@/localization';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { AppProvider, useApp } from '@/storage/AppProvider';
import { Busy, Button, Label, Screen } from '@/components/ui';
import { useTheme } from '@/theme';

function Root() {
  const { loading, error, reload } = useApp();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  if (loading) return <Screen><Busy /><Label>{t('loading')}</Label></Screen>;
  if (error) return <Screen><Label>{t(error)}</Label><Button title={t('retry')} onPress={() => { void reload(); }} /></Screen>;
  return <><StatusBar style={isDark ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false }} /></>;
}
export default function Layout() { return <AppProvider><Root /></AppProvider>; }
