import { useSessionStore } from '@/store/session';

import { api, apiClient, unwrap, type Locale } from '..';

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
