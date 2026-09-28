import { useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Button, Label } from '@/components/ui';
import { useTheme } from '@/theme';
import { datePickerBounds, selectedPickerDate } from './formInput';
import { SelectField } from './FormControls';

export function DatePickerField({ value, month, onChange, error, disabled }: {
  value: string; month: string; onChange(value: string): void; error?: string; disabled?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [pickerError, setPickerError] = useState(false);
  const [draft, setDraft] = useState(new Date(`${value}T12:00:00`));
  const bounds = datePickerBounds(month);
  const available = bounds.minimumDate <= bounds.maximumDate;
  const formatted = new Intl.DateTimeFormat(i18n.language === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
  const select = (date: Date) => {
    setVisible(false);
    const selected = selectedPickerDate(date, month);
    if (selected) onChange(selected);
  };
  const open = () => {
    Keyboard.dismiss();
    setPickerError(false);
    // Recompute at tap time in case the app remained open overnight.
    const range = datePickerBounds(month);
    if (range.minimumDate > range.maximumDate) return;
    const existing = new Date(`${value}T12:00:00`);
    const initial = new Date(Math.min(range.maximumDate.getTime(), Math.max(range.minimumDate.getTime(), existing.getTime())));
    setVisible(true);
    if (Platform.OS === 'android') {
      try {
        DateTimePickerAndroid.open({ value: initial, mode: 'date', display: 'calendar', ...range,
          positiveButton: { label: t('transactionForm.selectDate') }, negativeButton: { label: t('cancel') },
          onValueChange: (_event, date) => select(date),
          onDismiss: () => setVisible(false),
          onError: () => { setVisible(false); setPickerError(true); },
        });
      } catch { setVisible(false); setPickerError(true); }
    } else { setDraft(initial); }
  };
  return <>
    <SelectField label={t('date')} value={formatted} icon="▦" disabled={disabled || !available}
      error={error ?? (pickerError ? t('transactionForm.datePickerError') : undefined)} expanded={visible} onPress={open} />
    {Platform.OS === 'ios' && <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 22 }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={() => setVisible(false)} accessibilityLabel={t('cancel')} accessibilityRole="button" />
        <View accessibilityViewIsModal style={{ padding: 20, borderRadius: 20, gap: 12, backgroundColor: colors.surface }}>
          <Label bold>{t('date')}</Label>
          <DateTimePicker value={draft} mode="date" display="spinner" {...bounds} locale={i18n.language === 'bn' ? 'bn-BD' : 'en-GB'}
            themeVariant={isDark ? 'dark' : 'light'} onValueChange={(_event, date) => setDraft(date)} />
          <Button title={t('transactionForm.selectDate')} onPress={() => select(draft)} />
          <Button secondary title={t('cancel')} onPress={() => setVisible(false)} />
        </View>
      </View>
    </Modal>}
  </>;
}
