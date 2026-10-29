// Адрес API и флаги окружения. Значения подставляются при сборке из EXPO_PUBLIC_* (.env.local / EAS).
// Обращаться к process.env.EXPO_PUBLIC_* нужно напрямую, без деструктуризации, иначе Expo их не подставит.

export type AppEnv = 'development' | 'staging' | 'production';

const APP_ENVS: readonly AppEnv[] = ['development', 'staging', 'production'];

function readAppEnv(raw: string | undefined): AppEnv {
  return APP_ENVS.find((env) => env === raw) ?? 'development';
}

export function parseApiUrl(raw: string | undefined, appEnv: AppEnv) {
  if (!raw) {
    throw new Error('EXPO_PUBLIC_API_URL не задан (см. .env.example)');
  }
  const apiUrl = raw.replace(/\/+$/, '');
  if (!/\/api\/v1$/.test(apiUrl)) {
    throw new Error('EXPO_PUBLIC_API_URL должен заканчиваться на /api/v1');
  }
  if (appEnv !== 'development' && !apiUrl.startsWith('https://')) {
    throw new Error('Вне development API доступен только по HTTPS');
  }
  // Пути в schema.d.ts уже начинаются с /api/v1, поэтому клиенту нужен адрес без него.
  return { apiUrl, apiOrigin: apiUrl.replace(/\/api\/v1$/, '') };
}

const appEnv = readAppEnv(process.env.EXPO_PUBLIC_APP_ENV);

export const config = {
  appEnv,
  ...parseApiUrl(process.env.EXPO_PUBLIC_API_URL, appEnv),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
  /** Адрес сайта для ссылок «Поделиться» (`<webUrl>/tracking/<номер>`). Пусто — делимся только номером. */
  webUrl: process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/+$/, '') || undefined,
  /** Мок /mobile/auth/* до появления их на бэкенде (src/api/mobileAuth.ts). Только в development. */
  mockMobileAuth: appEnv === 'development' && process.env.EXPO_PUBLIC_MOCK_MOBILE_AUTH === 'true',
} as const;
