import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { ApiError } from '@/api/errors';
import { login } from '@/api/endpoints/auth';
import { fieldError, onInvalidForm } from '@/lib/forms';
import { haptics } from '@/lib/haptics';
import {
  Button,
  RequestError,
  Screen,
  Sheet,
  Text,
  TextField,
  Wordmark,
  screenPadding,
  sizes,
  spacing,
  useColors,
  useScreenInsets,
} from '@/ui';

const schema = z.object({
  email: z.email('validation.email'),
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
 * Регистрации и восстановления пароля в приложении пока нет — кнопки объясняют, где это сделать.
 * «Войти по Face ID» появится на этапе 3 (биометрия), до этого скрыта.
 */
export function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const [requestError, setRequestError] = useState<unknown>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [info, setInfo] = useState<'register' | 'forgot' | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const submit = form.handleSubmit(async ({ email, password }) => {
    setRequestError(null);
    try {
      await login(email.trim(), password);
      haptics.success();
      router.back();
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
            onPress={() => setInfo('register')}
          />
          <Button
            title={t('auth.signIn')}
            loading={form.formState.isSubmitting}
            onPress={() => void submit()}
          />
        </View>
      }
    >
      <View style={styles.top}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={styles.close}
        >
          <X color={colors.text} size={24} strokeWidth={1.75} />
        </Pressable>
      </View>
      <SignInContent>
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
              <TextField
                ref={field.ref}
                label={t('auth.password')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(t, fieldState.error)}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={() => void submit()}
                accessory={
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? t('auth.hidePassword') : t('auth.showPassword')
                    }
                    style={styles.eye}
                  >
                    {showPassword ? (
                      <EyeOff color={colors.text} size={20} strokeWidth={1.75} />
                    ) : (
                      <Eye color={colors.text} size={20} strokeWidth={1.75} />
                    )}
                  </Pressable>
                }
              />
            )}
          />
          <Pressable
            onPress={() => setInfo('forgot')}
            accessibilityRole="button"
            style={styles.forgot}
          >
            <Text variant="bodyStrong" style={[styles.forgotText, { color: colors.navy }]}>
              {t('auth.forgotPassword')}
            </Text>
          </Pressable>
        </View>

        <RequestError error={requestError} />
      </SignInContent>

      <Sheet
        visible={info !== null}
        onClose={() => setInfo(null)}
        title={info === 'forgot' ? t('auth.forgotTitle') : t('auth.registerTitle')}
        message={info === 'forgot' ? t('auth.forgotText') : t('auth.noAccount')}
        closeLabel={t('common.close')}
      >
        <Button title={t('common.ok')} onPress={() => setInfo(null)} style={styles.flex} />
      </Sheet>
    </Screen>
  );
}

function SignInContent({ children }: { children: ReactNode }) {
  const insets = useScreenInsets();
  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'flex-end' },
  close: {
    width: sizes.hitTarget,
    height: sizes.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { gap: spacing.lg },
  brand: { alignItems: 'center', marginTop: spacing.xl },
  subtitle: { marginTop: 10, textAlign: 'center', fontSize: 15 },
  fields: { gap: 22, marginTop: spacing.xl },
  eye: {
    width: sizes.hitTarget,
    height: sizes.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  flex: { flex: 1 },
});
