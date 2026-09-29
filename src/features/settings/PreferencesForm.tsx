import { userErrorKey, controlledError } from '@/utils/errors';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Button, Choices, Field, Label } from '@/components/ui';
import { useApp } from '@/storage/AppProvider';
import { emailSchema } from '@/features/transactions/validation/transaction';
import { currencyChangeNeedsConfirmation } from '@/constants/currencies';
import { CurrencySelect } from './CurrencySelect';

export function PreferencesForm({ onboarding = false }: { onboarding?: boolean }) {
  const { settings, saveSettings, ledger } = useApp();
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(settings.language);
  const [theme, setTheme] = useState(settings.theme);
  const [currency, setCurrency] = useState(settings.currency);
  const [saving, setSaving] = useState(false);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm({ resolver: zodResolver(emailSchema), defaultValues: { email: settings.email } });
  const save = async (email: string) => {
    if (currencyChangeNeedsConfirmation(settings.currency, currency, ledger?.transactions.length ?? 0)) {
      const confirmed = await new Promise<boolean>(resolve => Alert.alert(t('currencySettings.changeTitle'), t('currencySettings.warning'), [
        { text: t('cancel'), style: 'cancel', onPress: () => resolve(false) },
        { text: t('currencySettings.change'), onPress: () => resolve(true) },
      ], { cancelable: true, onDismiss: () => resolve(false) }));
      if (!confirmed) return;
    }
    setSaving(true);
    try {
      await saveSettings({ email: email.trim(), language, theme, currency, onboardingCompleted: true });
      if (onboarding) router.replace('/(tabs)');
      else Alert.alert(t('saved'));
    } catch (error) { Alert.alert(t('errors.title'), t(userErrorKey(error, 'errors.storage'))); }
    finally { setSaving(false); }
  };
  return <View style={{ gap: 20 }}>
    <Label bold>{t('language')}</Label>
    <Choices value={language} options={[{ value: 'en', label: 'English' }, { value: 'bn', label: 'বাংলা' }]} onChange={next => { setLanguage(next); void i18n.changeLanguage(next).catch(error => Alert.alert(t('errors.title'), t(controlledError(error, 'errors.generic').key))); }} />
    <Controller control={control} name="email" render={({ field, fieldState }) => <Field label={t('email')} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error ? t('validation.email') : undefined} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />} />
    <Label muted>{t('emailHint')}</Label>
    {!onboarding && <CurrencySelect value={currency} onChange={setCurrency} disabled={isSubmitting || saving} />}
    {!onboarding && <><Label bold>{t('appearance')}</Label><Choices<'system' | 'light' | 'dark'> value={theme} options={(['system', 'light', 'dark'] as const).map(value => ({ value, label: t(value) }))} onChange={setTheme} /></>}
    <Button disabled={isSubmitting || saving} title={t(onboarding ? 'getStarted' : 'save')} onPress={() => { void handleSubmit(data => save(data.email))(); }} />
    {onboarding && <Button disabled={isSubmitting || saving} secondary title={t('skip')} onPress={() => { void save(''); }} />}
  </View>;
}
