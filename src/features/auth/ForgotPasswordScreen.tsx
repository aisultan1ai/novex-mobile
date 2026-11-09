import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { z } from 'zod';

import { forgotPassword } from '@/api/endpoints/auth';
import { ApiError } from '@/api/errors';
import { fieldError, onInvalidForm } from '@/lib/forms';
import { haptics } from '@/lib/haptics';
import { Button, RequestError, Screen, TextField, screenPadding, spacing, useColors } from '@/ui';

import { AuthHeading, AuthScroll, AuthTopBar, useBackToSignIn } from './AuthChrome';
import { emailSchema } from './authForms';

type Values = z.infer<typeof emailSchema>;

/**
 * «Забыли пароль?»: email → письмо со ссылкой сброса. Ответ бэкенда одинаковый, есть такой
 * аккаунт или нет, — экран тоже не говорит, существует ли аккаунт.
 * Ссылка из письма ведёт на /reset-password (сайт; в приложении — после deep links, этап 3).
 */
export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const backToSignIn = useBackToSignIn();
  const { email: initialEmail } = useLocalSearchParams<{ email?: string }>();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<unknown>(null);

  const form = useForm<Values>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: initialEmail ?? '' },
  });

  const submit = form.handleSubmit(async ({ email }) => {
    setRequestError(null);
    const normalized = email.trim().toLowerCase();
    try {
      await forgotPassword(normalized);
      haptics.success();
      setSentTo(normalized);
    } catch (error) {
      haptics.error();
      if (error instanceof ApiError && error.fieldErrors.email) {
        form.setError('email', { message: error.fieldErrors.email });
      } else {
        setRequestError(error);
      }
    }
  }, onInvalidForm);

  if (sentTo) {
    return (
      <Screen
        footer={
          <View style={styles.footer}>
            <Button title={t('forgot.backToSignIn')} onPress={backToSignIn} />
          </View>
        }
      >
        <AuthTopBar />
        <AuthScroll>
          <View style={styles.icon}>
            <MailCheck color={colors.strong} size={48} strokeWidth={1.5} />
          </View>
          <AuthHeading
            title={t('forgot.sentTitle')}
            text={t('forgot.sentText', { email: sentTo })}
          />
        </AuthScroll>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            title={t('forgot.submit')}
            loading={form.formState.isSubmitting}
            onPress={() => void submit()}
          />
        </View>
      }
    >
      <AuthTopBar />
      <AuthScroll>
        <AuthHeading title={t('forgot.title')} text={t('forgot.text')} />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              ref={field.ref}
              label={t('auth.email')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError(t, fieldState.error)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={() => void submit()}
            />
          )}
        />
        <RequestError error={requestError} />
      </AuthScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: { marginTop: spacing.xl },
  footer: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
});
