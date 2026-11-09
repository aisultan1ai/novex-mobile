import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { ApiError } from '@/api/errors';
import { login } from '@/api/endpoints/auth';
import { fieldError, onInvalidForm } from '@/lib/forms';
import { haptics } from '@/lib/haptics';
import {
  Button,
  RequestError,
  Screen,
  Text,
  TextField,
  Wordmark,
  screenPadding,
  sizes,
  spacing,
  useColors,
} from '@/ui';

import { AuthScroll, AuthTopBar, PasswordField, useCloseAuth } from './AuthChrome';
import { emailField } from './authForms';

const schema = z.object({
  email: emailField,
  password: z.string().min(1, 'validation.passwordRequired'),
});
type Values = z.infer<typeof schema>;

/**
 * Вход (DESIGN-TZ 6.2) и Soft Wall: открывается модально, когда гость нажимает «Оформить».
 * Расчёт и выбранный тариф не теряются — после входа экран тарифов продолжит оформление сам.
 *
 *   «novex.» + подзаголовок · Email · Пароль (показать) · «Забыли пароль?»
 *   футер: «Создать аккаунт» (secondary) · «Войти» (primary)
 *
 * «Войти по Face ID» появится на этапе 3 (биометрия), до этого скрыта.
 */
export function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const close = useCloseAuth();
  const [requestError, setRequestError] = useState<unknown>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const submit = form.handleSubmit(async ({ email, password }) => {
    setRequestError(null);
    try {
      await login(email.trim(), password);
      haptics.success();
      close();
    } catch (error) {
      haptics.error();
      if (error instanceof ApiError && error.kind === 'validation') {
        for (const [name, message] of Object.entries(error.fieldErrors)) {
          if (name === 'email' || name === 'password') form.setError(name, { message });
        }
      } else {
        setRequestError(error);
      }
    }
  }, onInvalidForm);

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            variant="secondary"
            title={t('auth.createAccount')}
            onPress={() => router.push('/register')}
          />
          <Button
            title={t('auth.signIn')}
            loading={form.formState.isSubmitting}
            onPress={() => void submit()}
          />
        </View>
      }
    >
      <AuthTopBar />
      <AuthScroll>
        <View style={styles.brand}>
          <Wordmark size={34} />
          <Text tone="muted" style={styles.subtitle}>
            {t('auth.wallText')}
          </Text>
        </View>

        <View style={styles.fields}>
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
                textContentType="username"
                returnKeyType="next"
              />
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <PasswordField
                ref={field.ref}
                label={t('auth.password')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(t, fieldState.error)}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={() => void submit()}
              />
            )}
          />
          <Pressable
            onPress={() => router.push('/forgot-password')}
            accessibilityRole="button"
            style={styles.forgot}
          >
            <Text variant="bodyStrong" style={[styles.forgotText, { color: colors.strong }]}>
              {t('auth.forgotPassword')}
            </Text>
          </Pressable>
        </View>

        <RequestError error={requestError} />
      </AuthScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginTop: spacing.xl },
  subtitle: { marginTop: 10, textAlign: 'center', fontSize: 15 },
  fields: { gap: 22, marginTop: spacing.xl },
  forgot: {
    alignSelf: 'flex-end',
    minHeight: sizes.hitTarget,
    justifyContent: 'center',
    marginTop: -6,
  },
  forgotText: { fontSize: 14 },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
});
