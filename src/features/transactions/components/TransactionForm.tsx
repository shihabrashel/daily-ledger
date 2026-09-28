import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Choices, Field, Label } from '@/components/ui';
import { useApp } from '@/storage/AppProvider';
import { categoriesFor } from '@/constants/categories';
import { localDate } from '@/utils/date';
import { transactionSchema, type TransactionForm as FormValues } from '../validation/transaction';
import type { Transaction } from '../types';

export function TransactionForm({ transaction }: { transaction?: Transaction }) {
  const { ledger, saveTransaction } = useApp();
  const { t } = useTranslation();
  const { control, setValue, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(transactionSchema(ledger!.activeMonth)),
    defaultValues: transaction ? { ...transaction, amount: String(transaction.amount), description: transaction.description ?? '' } : {
      date: localDate(), type: 'expense', categoryId: '', amount: '', description: '', necessity: undefined,
    },
  });
  const type = useWatch({ control, name: 'type' });
  const save = handleSubmit(async values => {
    try { await saveTransaction(values, transaction?.id); router.back(); }
    catch (error) { Alert.alert(t('errors.title'), t(error instanceof Error && error.message.startsWith('errors.') ? error.message : 'errors.storage')); }
  });
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={{ gap: 20 }}>
    <Controller control={control} name="type" render={({ field }) => <Choices value={field.value} options={(['expense', 'income'] as const).map(value => ({ value, label: t(value) }))} onChange={value => { field.onChange(value); setValue('categoryId', ''); setValue('necessity', undefined); }} />} />
    <Controller control={control} name="date" render={({ field, fieldState }) => <Field label={t('date')} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message && t(fieldState.error.message)} placeholder="YYYY-MM-DD" autoCapitalize="none" maxLength={10} />} />
    <Label muted size={13}>{t('dateHint')}</Label>
    <Controller control={control} name="amount" render={({ field, fieldState }) => <Field label={t('amount')} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message && t(fieldState.error.message)} keyboardType="decimal-pad" />} />
    <Label bold>{t('category')}</Label>
    <Controller control={control} name="categoryId" render={({ field, fieldState }) => <><Choices value={field.value} options={categoriesFor(type).map(value => ({ value, label: t(`categories.${value}`) }))} onChange={field.onChange} />{fieldState.error && <Label>{t('validation.category')}</Label>}</>} />
    {type === 'expense' && <><Label bold>{t('necessity')}</Label>
      <Controller control={control} name="necessity" render={({ field, fieldState }) => <><Choices value={field.value ?? ''} options={(['essential', 'optional'] as const).map(value => ({ value, label: t(value) }))} onChange={field.onChange} />{fieldState.error && <Label>{t('validation.necessity')}</Label>}</>} />
      <Label muted size={13}>{t('essentialHint')}</Label><Label muted size={13}>{t('optionalHint')}</Label></>}
    <Controller control={control} name="description" render={({ field, fieldState }) => <Field label={t('description')} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message && t(fieldState.error.message)} multiline maxLength={500} />} />
    <Button title={t('save')} disabled={isSubmitting} onPress={() => { void save(); }} />
    <Button secondary title={t('cancel')} disabled={isSubmitting} onPress={() => router.back()} />
  </View></KeyboardAvoidingView>;
}
