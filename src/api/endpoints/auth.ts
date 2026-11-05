import { useSessionStore } from '@/store/session';

import { api, apiClient, unwrap, type Locale } from '..';
import type { components } from '../schema';

export type RegisterRequest = components['schemas']['RegisterRequest'];

/** Вход по email и паролю (ТЗ 5.2). Ошибки — ApiError с текстом от бэкенда. */
export async function login(email: string, password: string) {
  const profile = await apiClient.login(email, password);
  useSessionStore.getState().setStatus('signedIn');
  return profile;
}

/** Выход: отозвать токен этого устройства на сервере и стереть его с телефона. */
export async function logout() {
  await apiClient.logout();
  useSessionStore.getState().setStatus('signedOut');
}

/** Язык писем и push-уведомлений (ТЗ 5.3). */
export function updateLocale(locale: Locale) {
  return unwrap(api.PATCH('/api/v1/auth/locale', { body: { locale } }));
}

/**
 * Регистрация (общая с сайтом). Токенов не выдаёт — после неё приложение входит тем же паролем.
 * 409 — email уже занят. Письмо подтверждения бэкенд отправляет сам, на языке из X-Locale.
 */
export function register(body: RegisterRequest) {
  return unwrap(api.POST('/api/v1/auth/register', { body }));
}

/** Повторное письмо подтверждения (нужен вход). 409 — «подождите N сек.» с текстом от бэкенда. */
export function resendVerification() {
  return unwrap(api.POST('/api/v1/auth/resend-verification'));
}

/** Подтверждение email по токену из ссылки в письме. */
export function verifyEmail(token: string) {
  return unwrap(api.POST('/api/v1/auth/verify-email', { body: { token } }));
}

/** Письмо со ссылкой сброса. Ответ одинаковый, есть такой аккаунт или нет. */
export function forgotPassword(email: string) {
  return unwrap(api.POST('/api/v1/auth/forgot-password', { body: { email } }));
}

/** Новый пароль по токену из ссылки в письме. */
export function resetPassword(token: string, newPassword: string) {
  return unwrap(
    api.POST('/api/v1/auth/reset-password', { body: { token, new_password: newPassword } }),
  );
}
