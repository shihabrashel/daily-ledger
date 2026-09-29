import { forwardRef } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui';
import { useTheme } from '@/theme';
import { FieldError } from './FormControls';
import { amountInput } from './formInput';
import { useApp } from '@/storage/AppProvider';
import { SUPPORTED_CURRENCIES } from '@/constants/currencies';

export const CurrencyInput = forwardRef<TextInput, {
  value: string; onChange(value: string): void; onBlur(): void; error?: string; disabled?: boolean;
}>(function CurrencyInput({ value, onChange, onBlur, error, disabled }, ref) {
  const { colors } = useTheme();
  const { settings } = useApp();
  const { t } = useTranslation();
  return <View style={{ gap: 8 }}>
    <Label bold>{t('amount')} ({settings.currency})</Label>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 80, paddingHorizontal: 18,
      borderWidth: 1, borderColor: error ? colors.danger : colors.border, borderRadius: 16, backgroundColor: colors.surface }}>
      <Text accessible={false} style={{ color: colors.primary, fontSize: 28 }}>{SUPPORTED_CURRENCIES[settings.currency].symbol}</Text>
      <TextInput ref={ref} accessibilityLabel={`${t('amount')} (${settings.currency})`} value={value} editable={!disabled}
        onChangeText={text => { const next = amountInput(text); if (next !== undefined) onChange(next); }}
        onBlur={onBlur} keyboardType="decimal-pad" inputMode="decimal" placeholder={t('transactionForm.amountPlaceholder')}
        placeholderTextColor={colors.muted} maxLength={12} selectTextOnFocus returnKeyType="done"
        style={{ flex: 1, minHeight: 78, paddingVertical: 16, color: colors.text, fontSize: 30, fontWeight: '600' }} />
    </View>
    <FieldError message={error} />
  </View>;
});
