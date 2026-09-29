import { Pressable, View, Text } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '../types';
import { Label } from '@/components/ui';
import { currency } from '@/utils/currency';
import { useTheme } from '@/theme';
import { categoryTranslationKey } from '@/constants/categories';
import { useApp } from '@/storage/AppProvider';

export function TransactionRow({ item }: { item: Transaction }) {
  const { settings } = useApp();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const date = new Intl.DateTimeFormat(i18n.language === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${item.date}T12:00:00`));
  return <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: item.id } })} style={{ minHeight: 72, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <View style={{ flex: 1 }}><Label bold>{t(categoryTranslationKey(item.categoryId, item.type))}</Label><Label muted size={13}>{date} · {t(item.type)}</Label></View>
    <Text style={{ fontSize: 17, fontWeight: '700', color: item.type === 'income' ? colors.primary : colors.text }}>{item.type === 'income' ? '+' : '−'}{currency(item.amount, settings.currency, i18n.language)}</Text>
  </Pressable>;
}
