import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Label } from '@/components/ui';
import { useApp } from '@/storage/AppProvider';
import { categoriesFor } from '@/constants/categories';
import { localDate } from '@/utils/date';
import { transactionSchema, type TransactionForm as FormValues } from '../validation/transaction';
import type { Transaction } from '../types';
import { useTheme } from '@/theme';
import { DatePickerField } from './DatePickerField';
import { CategorySelect } from './CategorySelect';
import { CurrencyInput } from './CurrencyInput';
import { FieldError, SegmentedControl } from './FormControls';

export function TransactionForm({ transaction, onDelete, busy = false }: { transaction?: Transaction; onDelete?(): void; busy?: boolean }) {
  const { ledger, saveTransaction } = useApp();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { control, getValues, setValue, clearErrors, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(transactionSchema(ledger!.activeMonth)),
    defaultValues: transaction ? { ...transaction, amount: String(transaction.amount), description: transaction.description ?? '' } : {
      date: localDate(), type: 'expense', categoryId: '', amount: '', description: '', necessity: undefined,
    },
  });
  const type = useWatch({ control, name: 'type' });
  const necessity = useWatch({ control, name: 'necessity' });
  const disabled = isSubmitting || busy;
  const save = handleSubmit(async values => {
    try { await saveTransaction(values, transaction?.id); router.back(); }
    catch (error) { Alert.alert(t('errors.title'), t(error instanceof Error && error.message.startsWith('errors.') ? error.message : 'errors.storage')); }
  });
  return <View style={{ gap: 24 }}>
    <Controller control={control} name="type" render={({ field, fieldState }) => <SegmentedControl
      label={t('transactionForm.type')} value={field.value} disabled={disabled}
      error={fieldState.error ? t('transactionForm.typeRequired') : undefined}
      options={(['expense', 'income'] as const).map(value => ({ value, label: t(value) }))}
      onChange={value => {
        if (value === field.value) return;
        field.onChange(value);
        if (!categoriesFor(value).includes(getValues('categoryId'))) {
          setValue('categoryId', '', { shouldDirty: true });
          clearErrors('categoryId');
        }
        if (value === 'income') { setValue('necessity', undefined, { shouldDirty: true }); clearErrors('necessity'); }
      }} />} />
    <Controller control={control} name="date" render={({ field, fieldState }) => <DatePickerField
      value={field.value} month={ledger!.activeMonth} onChange={field.onChange} disabled={disabled}
      error={fieldState.error?.message && t(fieldState.error.message)} />} />
    <Controller control={control} name="categoryId" render={({ field, fieldState }) => <CategorySelect
      value={field.value} type={type} onChange={field.onChange} disabled={disabled}
      error={fieldState.error ? t('validation.category') : undefined} />} />
    <Controller control={control} name="amount" render={({ field, fieldState }) => <CurrencyInput
      ref={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} disabled={disabled}
      error={fieldState.error?.message && t(fieldState.error.message)} />} />
    {type === 'expense' && <View style={{ gap: 8 }}>
      <Controller control={control} name="necessity" render={({ field, fieldState }) => <SegmentedControl
        label={t('necessity')} value={field.value} disabled={disabled} onChange={field.onChange}
        options={(['essential', 'optional'] as const).map(value => ({ value, label: t(value) }))}
        error={fieldState.error ? t('validation.necessity') : undefined} />} />
      <Label muted size={13}>{t(necessity === 'optional' ? 'optionalHint' : 'essentialHint')}</Label>
    </View>}
    <Controller control={control} name="description" render={({ field, fieldState }) => <View style={{ gap: 8 }}>
      <Label bold>{t('description')}</Label>
      <TextInput ref={field.ref} accessibilityLabel={t('description')} value={field.value} editable={!disabled}
        onChangeText={field.onChange} onBlur={field.onBlur} multiline maxLength={500}
        placeholder={t('transactionForm.notePlaceholder')} placeholderTextColor={colors.muted}
        style={{ minHeight: 112, padding: 16, borderRadius: 14, borderWidth: 1,
          borderColor: fieldState.error ? colors.danger : colors.border, backgroundColor: colors.surface,
          color: colors.text, fontSize: 16, lineHeight: 24, textAlignVertical: 'top' }} />
      <FieldError message={fieldState.error?.message && t(fieldState.error.message)} />
    </View>} />
    <View style={{ gap: 12, paddingTop: 8 }}>
      <Button title={t(transaction ? 'transactionForm.update' : 'transactionForm.save')} disabled={disabled} onPress={() => { void save(); }} />
      <Button secondary title={t('cancel')} disabled={disabled} onPress={() => router.back()} />
      {transaction && onDelete && <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
        onPress={onDelete} style={({ pressed }) => ({ minHeight: 48, padding: 12, alignItems: 'center', opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}>
        <Text style={{ color: colors.danger, fontSize: 16 }}>{t('delete')}</Text>
      </Pressable>}
    </View>
  </View>;
}
