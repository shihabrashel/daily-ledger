import { useState } from 'react';
import { FlatList, Keyboard, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, Label } from '@/components/ui';
import { categoriesFor } from '@/constants/categories';
import { useTheme } from '@/theme';
import type { TransactionType } from '../types';
import { SelectField } from './FormControls';

export function CategorySelect({ value, type, onChange, error, disabled }: {
  value: string; type: TransactionType; onChange(value: string): void; error?: string; disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const options = categoriesFor(type);
  const dismiss = () => setVisible(false);
  return <>
    <SelectField label={t('category')} value={options.includes(value) ? t(`categories.${value}`) : t('transactionForm.selectCategory')}
      icon="⌄" error={error} disabled={disabled} expanded={visible} onPress={() => { Keyboard.dismiss(); setVisible(true); }} />
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismiss} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('cancel')} onPress={dismiss} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
        <SafeAreaView edges={['bottom', 'left', 'right']} accessibilityViewIsModal
          style={{ maxHeight: '80%', backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <View style={{ paddingHorizontal: 22, paddingTop: 24, paddingBottom: 16 }}>
            <Label bold size={22}>{t('transactionForm.selectCategory')}</Label>
            <Label muted>{t(type)}</Label>
          </View>
          <FlatList data={options} keyExtractor={item => item} style={{ flexGrow: 0, flexShrink: 1 }}
            keyboardShouldPersistTaps="handled" extraData={value} contentContainerStyle={{ paddingHorizontal: 14 }}
            renderItem={({ item }) => {
              const selected = item === value;
              return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }}
                accessibilityLabel={t(`categories.${item}`)} onPress={() => { onChange(item); dismiss(); }}
                style={({ pressed }) => ({ minHeight: 56, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12,
                  flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: selected ? colors.soft : pressed ? colors.background : colors.surface })}>
                <Text style={{ flex: 1, fontSize: 17, fontWeight: selected ? '700' : '400', color: colors.text }}>{t(`categories.${item}`)}</Text>
                {selected && <Text accessible={false} style={{ color: colors.primary, fontSize: 20 }}>✓</Text>}
              </Pressable>;
            }} />
          <View style={{ padding: 18 }}><Button secondary title={t('cancel')} onPress={dismiss} /></View>
        </SafeAreaView>
      </View>
    </Modal>
  </>;
}
