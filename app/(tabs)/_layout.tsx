import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { useApp } from '@/storage/AppProvider';
const icons = { index: '◫', transactions: '≡', reports: '▤', settings: '⚙' };
export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { settings } = useApp();
  if (!settings.onboardingCompleted) return <Redirect href="/onboarding" />;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border }, tabBarLabelStyle: { fontSize: 11 } }}>
    {(Object.keys(icons) as (keyof typeof icons)[]).map(name => <Tabs.Screen key={name} name={name} options={{ title: t(name === 'index' ? 'dashboard' : name), tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>{icons[name]}</Text> }} />)}
  </Tabs>;
}
