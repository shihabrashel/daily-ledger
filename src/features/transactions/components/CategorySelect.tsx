import { useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, Field, Label } from '@/components/ui';
import { useTheme } from '@/theme';
import { SelectField } from './FormControls';
import { searchCategories } from '@/constants/categories';

export function CategorySelect({ value, categories, onChange, error, disabled, allowAll = false }: {
  value: string; categories: readonly string[]; onChange(value: string): void; error?: string; disabled?: boolean; allowAll?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const { t } = useTranslation();
  const { colors } = useTheme();
  const labelFor = (id: string) => id ? t(`categories.${id}`) : t('allCategories');
  const options = searchCategories(allowAll ? ['', ...categories] : categories, search, labelFor);
  const dismiss = () => { setVisible(false); setSearch(''); Keyboard.dismiss(); };
  return <>
    <SelectField label={t('category')} value={categories.includes(value) || (allowAll && !value) ? labelFor(value) : t('transactionForm.selectCategory')}
      icon="⌄" error={error} disabled={disabled} expanded={visible} onPress={() => { Keyboard.dismiss(); setSearch(''); setVisible(true); }} />
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismiss} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('cancel')} onPress={dismiss} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
        <SafeAreaView edges={['bottom', 'left', 'right']} accessibilityViewIsModal
          style={{ maxHeight: '80%', backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <View style={{ paddingHorizontal: 22, paddingTop: 24, paddingBottom: 16 }}>
            <Label bold size={22}>{t('transactionForm.selectCategory')}</Label>
            <Field label={t('categorySearch')} placeholder={t('categorySearch')} value={search} onChangeText={setSearch} autoCorrect={false} autoCapitalize="none" />
          </View>
          <FlatList data={options} keyExtractor={item => item} style={{ flexGrow: 0, flexShrink: 1 }}
            keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" extraData={value} contentContainerStyle={{ paddingHorizontal: 14 }}
            ListEmptyComponent={<View style={{ padding: 16 }}><Label muted>{t('noCategories')}</Label></View>}
            renderItem={({ item }) => {
              const selected = item === value;
              return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }}
                accessibilityLabel={labelFor(item)} onPress={() => { onChange(item); dismiss(); }}
                style={({ pressed }) => ({ minHeight: 56, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12,
                  flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: selected ? colors.soft : pressed ? colors.background : colors.surface })}>
                <Text style={{ flex: 1, fontSize: 17, fontWeight: selected ? '700' : '400', color: colors.text }}>{labelFor(item)}</Text>
                {selected && <Text accessible={false} style={{ color: colors.primary, fontSize: 20 }}>✓</Text>}
              </Pressable>;
            }} />
          <View style={{ padding: 18 }}><Button secondary title={t('cancel')} onPress={dismiss} /></View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  </>;
}
