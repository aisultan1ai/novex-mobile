import { zodResolver } from '@hookform/resolvers/zod';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Locale } from '@/api/client';
import { login, register } from '@/api/endpoints/auth';
import { ApiError } from '@/api/errors';
import { config } from '@/config';
import { useLocale } from '@/i18n/useLocale';
import { fieldError, onInvalidForm } from '@/lib/forms';
import { haptics } from '@/lib/haptics';
import {
  Button,
  Chip,
  RequestError,
  Screen,
  Switch,
  Text,
  TextField,
  screenPadding,
  spacing,
  useColors,
} from '@/ui';

import { AuthHeading, AuthScroll, AuthTopBar, PasswordField, useBackToSignIn } from './AuthChrome';
import {
  PASSWORD_MIN,
  registerApiFields,
  registerDefaults,
  registerSchema,
  toRegisterRequest,
  type RegisterValues,
} from './authForms';

/** Страница сайта с политикой или условиями; без адреса сайта ссылок нет — только текст согласия. */
function legalUrl(page: 'privacy' | 'terms', locale: Locale): string | null {
  return config.webUrl ? `${config.webUrl}${locale === 'kk' ? '/kz' : ''}/${page}` : null;
}

/**
 * Регистрация (ТЗ 6.4, п. 2) — те же поля и правила, что на сайте:
 *   тип клиента (частное лицо / компания) · название компании · ФИО · ИИН или БИН (12 цифр)
 *   · email · телефон (необязательно) · пароль от 8 символов · согласие на обработку ПД (обязательно)
 * После создания аккаунта приложение сразу входит и показывает «Подтвердите email».
 */
export function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const locale = useLocale();
  const backToSignIn = useBackToSignIn();
  const [requestError, setRequestError] = useState<unknown>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaults,
  });
  const customerType = useWatch({ control: form.control, name: 'customerType' });
  const isCompany = customerType === 'company';
  const emailTaken = requestError instanceof ApiError && requestError.status === 409;

  const submit = form.handleSubmit(async (values) => {
    setRequestError(null);
    const body = toRegisterRequest(values);
    try {
      await register(body);
    } catch (error) {
      haptics.error();
      if (error instanceof ApiError && error.kind === 'validation') {
        let shown = false;
        for (const [name, message] of Object.entries(error.fieldErrors)) {
          const field = registerApiFields[name];
          if (field) {
            form.setError(field, { message });
            shown = true;
          }
        }
        if (!shown) setRequestError(error);
      } else {
        setRequestError(error);
      }
      return;
    }
    haptics.success();
    // Аккаунт создан. Если вход не удался (сеть) — экран подтверждения всё равно покажем,
    // а войти можно позже тем же паролем.
    await login(body.email, body.password).catch(() => undefined);
    router.replace({ pathname: '/verify-email', params: { email: body.email } });
  }, onInvalidForm);

  const privacy = legalUrl('privacy', locale);
  const terms = legalUrl('terms', locale);

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            title={t('register.submit')}
            loading={form.formState.isSubmitting}
            onPress={() => void submit()}
          />
        </View>
      }
    >
      <AuthTopBar />
      <AuthScroll>
        <AuthHeading title={t('register.title')} text={t('register.subtitle')} />

        <View
          style={styles.types}
          accessibilityRole="radiogroup"
          accessibilityLabel={t('register.accountType')}
        >
          {(['individual', 'company'] as const).map((type) => (
            <Chip
              key={type}
              variant="outline"
              stretch
              height={44}
              label={t(`register.${type}`)}
              selected={customerType === type}
              onPress={() => {
                haptics.select();
                form.setValue('customerType', type);
                // Ошибка ИИН/БИН называет вид номера — обновить её под новый тип.
                if (form.formState.isSubmitted) void form.trigger('taxId');
              }}
            />
          ))}
        </View>

        <View style={styles.fields}>
          {isCompany ? (
            <Controller
              control={form.control}
              name="companyName"
              render={({ field, fieldState }) => (
                <TextField
                  ref={field.ref}
                  label={t('register.companyName')}
                  placeholder={t('register.companyNamePlaceholder')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldError(t, fieldState.error)}
                  autoComplete="organization"
                  textContentType="organizationName"
                />
              )}
            />
          ) : null}
          <Controller
            control={form.control}
            name="fullName"
            render={({ field, fieldState }) => (
              <TextField
                ref={field.ref}
                label={isCompany ? t('register.contactName') : t('register.fullName')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(t, fieldState.error)}
                autoComplete="name"
                textContentType="name"
                autoCapitalize="words"
              />
            )}
          />
          <Controller
            control={form.control}
            name="taxId"
            render={({ field, fieldState }) => (
              <TextField
                ref={field.ref}
                label={isCompany ? t('register.bin') : t('register.iin')}
                hint={t('register.taxIdHint')}
                value={field.value}
                onChangeText={(v) => field.onChange(v.replace(/\D/g, '').slice(0, 12))}
                onBlur={field.onBlur}
                error={fieldError(t, fieldState.error)}
                keyboardType="number-pad"
                maxLength={12}
              />
            )}
          />
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
              />
            )}
          />
          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <TextField
                ref={field.ref}
                label={t('register.phone')}
                hint={t('register.optional')}
                placeholder="+7 701 000 00 00"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(t, fieldState.error)}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
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
                hint={t('register.passwordHint', { min: PASSWORD_MIN })}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(t, fieldState.error)}
                autoComplete="new-password"
                textContentType="newPassword"
              />
            )}
          />
        </View>

        <Controller
          control={form.control}
          name="consent"
          render={({ field, fieldState }) => (
            <View>
              <View style={styles.consent}>
                <Text variant="label" style={styles.consentText}>
                  {t('register.consent')}
                  {privacy && terms ? (
                    <>
                      {' '}
                      <Text
                        variant="label"
                        accessibilityRole="link"
                        onPress={() => void Linking.openURL(privacy)}
                        style={[styles.link, { color: colors.navy }]}
                      >
                        {t('register.privacy')}
                      </Text>
                      {` ${t('register.and')} `}
                      <Text
                        variant="label"
                        accessibilityRole="link"
                        onPress={() => void Linking.openURL(terms)}
                        style={[styles.link, { color: colors.navy }]}
                      >
                        {t('register.terms')}
                      </Text>
                    </>
                  ) : null}
                </Text>
                <Switch
                  accessibilityLabel={t('register.consent')}
                  value={field.value}
                  onValueChange={(on) => {
                    haptics.select();
                    field.onChange(on);
                  }}
                />
              </View>
              {fieldState.error ? (
                <Text variant="caption" style={[styles.consentError, { color: colors.danger }]}>
                  {fieldError(t, fieldState.error)}
                </Text>
              ) : null}
            </View>
          )}
        />

        <RequestError error={requestError} />
        {emailTaken ? (
          <View style={styles.taken}>
            <Button variant="secondary" title={t('auth.signIn')} onPress={backToSignIn} />
            <Button
              variant="ghost"
              title={t('auth.forgotPassword')}
              onPress={() => router.replace('/forgot-password')}
            />
          </View>
        ) : null}
      </AuthScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  types: { flexDirection: 'row', gap: spacing.xs },
  fields: { gap: 22 },
  consent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  consentText: { flex: 1 },
  consentError: { marginTop: spacing.xxs },
  link: { textDecorationLine: 'underline' },
  taken: { gap: spacing.xs, marginTop: -spacing.xs },
  footer: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
});
