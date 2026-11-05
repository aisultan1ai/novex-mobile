import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck, Link2Off } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { z } from 'zod';

import { resetPassword } from '@/api/endpoints/auth';
import { ApiError } from '@/api/errors';
import { fieldError, onInvalidForm } from '@/lib/forms';
import { haptics } from '@/lib/haptics';
import { Button, RequestError, Screen, screenPadding, spacing, useColors } from '@/ui';

import { AuthHeading, AuthScroll, AuthTopBar, PasswordField, useBackToSignIn } from './AuthChrome';
import { PASSWORD_MIN, resetSchema } from './authForms';

type Values = z.infer<typeof resetSchema>;

/**
 * Новый пароль по ссылке из письма (/reset-password?token=…). Пока нет deep links (этап 3),
 * ссылка открывает сайт; маршрут готов, чтобы с ними она открывалась в приложении.
 */
export function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const backToSignIn = useBackToSignIn();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [state, setState] = useState<'form' | 'done' | 'invalid'>(token ? 'form' : 'invalid');
  const [requestError, setRequestError] = useState<unknown>(null);

  const form = useForm<Values>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', repeat: '' },
  });

  const submit = form.handleSubmit(async ({ password }) => {
    if (!token) return;
    setRequestError(null);
    try {
      await resetPassword(token, password);
      haptics.success();
      setState('done');
    } catch (error) {
      haptics.error();
      if (error instanceof ApiError && error.fieldErrors.new_password) {
        form.setError('password', { message: error.fieldErrors.new_password });
      } else if (error instanceof ApiError && !error.isRetryable && error.kind !== 'rate_limit') {
        // Токен истёк или уже использован — просить новую ссылку.
        setState('invalid');
      } else {
        setRequestError(error);
      }
    }
  }, onInvalidForm);

  if (state !== 'form') {
    const done = state === 'done';
    return (
      <Screen
        footer={
          <View style={styles.footer}>
            {done ? (
              <Button title={t('auth.signIn')} onPress={backToSignIn} />
            ) : (
              <Button
                title={t('reset.requestNew')}
                onPress={() => router.replace('/forgot-password')}
              />
            )}
          </View>
        }
      >
        <AuthTopBar />
        <AuthScroll>
          <View style={styles.icon}>
            {done ? (
              <CircleCheck color={colors.status.success} size={48} strokeWidth={1.5} />
            ) : (
              <Link2Off color={colors.danger} size={48} strokeWidth={1.5} />
            )}
          </View>
          <AuthHeading
            title={done ? t('reset.doneTitle') : t('reset.invalidTitle')}
            text={done ? t('reset.doneText') : t('reset.invalidText')}
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
            title={t('reset.save')}
            loading={form.formState.isSubmitting}
            onPress={() => void submit()}
          />
        </View>
      }
    >
      <AuthTopBar />
      <AuthScroll>
        <AuthHeading title={t('reset.title')} text={t('reset.text', { min: PASSWORD_MIN })} />
        <View style={styles.fields}>
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <PasswordField
                ref={field.ref}
                label={t('reset.newPassword')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(t, fieldState.error)}
                autoComplete="new-password"
                textContentType="newPassword"
              />
            )}
          />
          <Controller
            control={form.control}
            name="repeat"
            render={({ field, fieldState }) => (
              <PasswordField
                ref={field.ref}
                label={t('reset.repeat')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(t, fieldState.error)}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={() => void submit()}
              />
            )}
          />
        </View>
        <RequestError error={requestError} />
      </AuthScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: { marginTop: spacing.xl },
  fields: { gap: 22 },
  footer: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
});
