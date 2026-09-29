import { Pressable, Text, View } from 'react-native';
import { Label } from '@/components/ui';
import { useTheme } from '@/theme';

export function FieldError({ message }: { message?: string }) {
  const { colors } = useTheme();
  return message ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: colors.danger, fontSize: 14, lineHeight: 20 }}>{message}</Text> : null;
}

export function SelectField({ label, value, icon, onPress, error, disabled, expanded }: {
  label: string; value: string; icon: string; onPress(): void; error?: string; disabled?: boolean; expanded?: boolean;
}) {
  const { colors } = useTheme();
  return <View style={{ gap: 8 }}>
    <Label bold>{label}</Label>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}
      accessibilityState={{ disabled, expanded }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
        borderColor: error ? colors.danger : colors.border, backgroundColor: colors.surface,
        opacity: disabled ? 0.5 : pressed ? 0.75 : 1 })}>
      <Text style={{ flex: 1, color: colors.text, fontSize: 17 }}>{value}</Text>
      <Text accessible={false} style={{ color: colors.muted, fontSize: 20 }}>{icon}</Text>
    </Pressable>
    <FieldError message={error} />
  </View>;
}

export function SegmentedControl<T extends string>({ label, value, options, onChange, error, disabled }: {
  label: string; value: T | undefined; options: { value: T; label: string }[];
  onChange(value: T): void; error?: string; disabled?: boolean;
}) {
  const { colors } = useTheme();
  return <View style={{ gap: 8 }}>
    <Label bold>{label}</Label>
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', gap: 12 }}>
      {options.map(option => {
        const selected = option.value === value;
        return <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label}
          accessibilityState={{ checked: selected, selected, disabled }} disabled={disabled} onPress={() => onChange(option.value)}
          style={({ pressed }) => ({ flex: 1, minHeight: 56, padding: 12, borderRadius: 12, borderWidth: 2,
            borderColor: selected ? colors.primary : colors.border,
            alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.surface, opacity: disabled ? 0.5 : pressed ? 0.75 : 1 })}>
          <Text style={{ fontSize: 16, fontWeight: selected ? '700' : '400', color: selected ? colors.onPrimary : colors.text }}>{selected ? '✓ ' : ''}{option.label}</Text>
        </Pressable>;
      })}
    </View>
    <FieldError message={error} />
  </View>;
}
