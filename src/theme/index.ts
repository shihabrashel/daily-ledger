import { useColorScheme } from 'react-native';
import { useApp } from '@/storage/AppProvider';
const light = { background: '#F4F6F3', surface: '#FFFFFF', text: '#172B26', muted: '#52645E', primary: '#176B50', onPrimary: '#FFFFFF', border: '#D8E1DC', danger: '#A53232', soft: '#E4F0E9' };
const dark: typeof light = { background: '#101B17', surface: '#1A2A23', text: '#F0F6F2', muted: '#B3C6BA', primary: '#91D5B1', onPrimary: '#10281D', border: '#385044', danger: '#FFADAD', soft: '#283F33' };
export function useTheme() {
  const { settings } = useApp();
  const system = useColorScheme();
  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && system === 'dark');
  return { colors: isDark ? dark : light, isDark };
}
