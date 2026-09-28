import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

export function Label({ children, muted = false, size = 16, bold = false }: React.PropsWithChildren<{ muted?: boolean; size?: number; bold?: boolean }>) {
  const { colors } = useTheme();
  return <Text style={{ color: muted ? colors.muted : colors.text, fontSize: size, fontWeight: bold ? '700' : '400', lineHeight: size * 1.5 }}>{children}</Text>;
}
export function Screen({ children }: React.PropsWithChildren) {
  const { colors } = useTheme();
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, paddingBottom: 40, gap: 20, maxWidth: 680, width: '100%', alignSelf: 'center' }}>{children}</ScrollView>
  </SafeAreaView>;
}
export function Card({ children }: React.PropsWithChildren) {
  const { colors } = useTheme();
  return <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 20, gap: 12 }}>{children}</View>;
}
export function Button({ title, onPress, secondary = false, danger = false, disabled = false }: { title: string; onPress(): void; secondary?: boolean; danger?: boolean; disabled?: boolean }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => ({ minHeight: 48, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: secondary ? colors.soft : danger ? colors.danger : colors.primary, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 })}>
    <Text style={{ color: secondary ? colors.text : danger ? '#FFFFFF' : colors.onPrimary, fontSize: 16, fontWeight: '600' }}>{title}</Text>
  </Pressable>;
}
export function Choices<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange(value: T): void }) {
  const { colors } = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)}
    style={{ minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: value === option.value ? colors.primary : colors.surface, borderColor: colors.border, borderWidth: 1 }}>
    <Text style={{ color: value === option.value ? colors.onPrimary : colors.text, fontSize: 15 }}>{option.label}</Text>
  </Pressable>)}</View>;
}
export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const { colors } = useTheme();
  return <View style={{ gap: 6 }}><Label bold>{label}</Label><TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} {...props}
    style={{ color: colors.text, backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border, borderWidth: 1, borderRadius: 12, minHeight: 50, padding: 14, fontSize: 16, textAlignVertical: props.multiline ? 'top' : 'center' }} />
    {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}</View>;
}
export function Busy() { const { colors } = useTheme(); return <ActivityIndicator size="large" color={colors.primary} />; }
