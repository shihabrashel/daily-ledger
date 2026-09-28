import { Redirect } from 'expo-router';
import { useApp } from '@/storage/AppProvider';
export default function Index() {
  const { settings } = useApp();
  return <Redirect href={settings.onboardingCompleted ? '/(tabs)' : '/onboarding'} />;
}
