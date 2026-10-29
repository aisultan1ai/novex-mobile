import type { components } from './schema';

// TODO(B1): эндпоинтов /mobile/auth/* пока нет в openapi.json. Когда PR с новой схемой придёт,
// заменить эти типы на components['schemas'][…], а вызовы в client.ts — на типизированный api.POST.
// Схема — ТЗ 5.2.

type Profile = components['schemas']['ProfileResponse'];

export const MOBILE_AUTH = {
  login: '/api/v1/mobile/auth/login',
  refresh: '/api/v1/mobile/auth/refresh',
  logout: '/api/v1/mobile/auth/logout',
} as const;

export interface MobileLoginRequest {
  email: string;
  password: string;
  device_id: string;
}

export interface MobileTokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface MobileLoginResponse extends MobileTokenPair {
  profile: Profile;
}

export interface MobileRefreshRequest {
  refresh_token: string;
  device_id: string;
}

export type MobileLogoutRequest = MobileRefreshRequest;

/**
 * Мок /mobile/auth/* для разработки, пока бэкенд их не выдал (EXPO_PUBLIC_MOCK_MOBILE_AUTH=true).
 * Вход идёт через настоящий сайтовый /auth/login — access-токен настоящий, данные живые.
 * Обновить такой токен нельзя: через ~60 минут мок вернёт 401 и приложение уйдёт на экран входа.
 * Остальные запросы проходят к бэкенду без изменений.
 */
export function withMobileAuthMock(fetchImpl: typeof fetch): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);

    if (url.pathname === MOBILE_AUTH.login) {
      const { email, password } = (await request.json()) as MobileLoginRequest;
      const response = await fetchImpl(`${url.origin}/api/v1/auth/login`, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ email, password }),
        credentials: 'omit',
      });
      if (!response.ok) return response;
      const body = (await response.json()) as components['schemas']['TokenResponse'];
      const result: MobileLoginResponse = {
        access_token: body.access_token,
        refresh_token: 'mock-refresh-token',
        expires_in: body.expires_in,
        profile: body.profile,
      };
      return jsonResponse(200, result);
    }
    if (url.pathname === MOBILE_AUTH.refresh) {
      return jsonResponse(401, { detail: 'Мок: обновление токена появится вместе с /mobile/auth' });
    }
    if (url.pathname === MOBILE_AUTH.logout) {
      return new Response(null, { status: 204 });
    }
    return fetchImpl(request);
  };
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
