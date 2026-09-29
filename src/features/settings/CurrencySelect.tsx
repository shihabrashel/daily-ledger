import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Choices, Label } from '@/components/ui';
import { CURRENCY_CODES, SUPPORTED_CURRENCIES, type CurrencyCode } from '@/constants/currencies';
import { currencyLabel } from '@/utils/currency';
import { useTheme } from '@/theme';

export function CurrencySelect({ value, onChange, disabled }: { value: CurrencyCode; onChange(value: CurrencyCode): void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const label = (code: CurrencyCode) => `${t(SUPPORTED_CURRENCIES[code].nameKey)} · ${currencyLabel(code)}`;
  return <View style={{ gap: 8 }}>
    <Label bold>{t('currencySettings.label')}</Label>
    <Button secondary disabled={disabled} title={label(value)} onPress={() => setOpen(true)} />
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} accessibilityRole="button" accessibilityLabel={t('cancel')} onPress={() => setOpen(false)} />
        <View accessibilityViewIsModal style={{ padding: 24, gap: 20, borderRadius: 20, backgroundColor: colors.surface }}>
          <Label bold size={22}>{t('currencySettings.select')}</Label>
          <Choices<CurrencyCode> value={value} options={CURRENCY_CODES.map(code => ({ value: code, label: label(code) }))}
            onChange={code => { onChange(code); setOpen(false); }} />
          <Button secondary title={t('cancel')} onPress={() => setOpen(false)} />
        </View>
      </View>
    </Modal>
  </View>;
}
