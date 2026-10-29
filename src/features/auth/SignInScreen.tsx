import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { LockKeyhole, X } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { ApiError } from '@/api/errors';
import { login } from '@/api/endpoints/auth';
import { fieldError, onInvalidForm } from '@/lib/forms';

import { haptics } from '@/lib/haptics';
import { Button, RequestError, Screen, Text, TextField, sizes, spacing, useColors } from '@/ui';

const schema = z.object({
  email: z.email('validation.email'),
  password: z.string().min(1, 'validation.passwordRequired'),
});
type Values = z.infer<typeof schema>;

/**
 * Soft Wall: открывается модально, когда гость нажимает «Оформить».
 * Расчёт и выбранный тариф не теряются — после входа экран тарифов продолжит оформление сам.
 */
export function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
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
        <Button
          title={t('auth.signIn')}
          loading={form.formState.isSubmitting}
          onPress={() => void submit()}
        />
      }
    >
      <View style={styles.top}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={spacing.xs}
          style={styles.close}
        >
          <X color={colors.icon} size={24} strokeWidth={1.75} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={[styles.icon, { backgroundColor: colors.subtle }]}>
          <LockKeyhole color={colors.primary} size={28} strokeWidth={1.75} />
        </View>
        <Text variant="title" accessibilityRole="header">
          {t('auth.wallTitle')}
        </Text>
        <Text tone="muted">{t('auth.wallText')}</Text>

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
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
            />
          )}
        />
        <RequestError error={requestError} />
        <Text variant="caption" tone="muted">
          {t('auth.noAccount')}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'flex-end', paddingTop: spacing.xs },
  close: {
    width: sizes.hitTarget,
    height: sizes.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { gap: spacing.md, paddingBottom: spacing.lg },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
