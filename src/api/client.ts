import createClient from 'openapi-fetch';

import { ApiError } from './errors';
import {
  MOBILE_AUTH,
  type MobileLoginResponse,
  type MobileLogoutRequest,
  type MobileRefreshRequest,
  type MobileTokenPair,
} from './mobileAuth';
import type { paths } from './schema';
import type { TokenStore } from './tokens';

export type Locale = 'ru' | 'kk';

export interface ApiClientDeps {
  /** Адрес сервера без /api/v1: пути в schema.d.ts уже содержат префикс. */
  apiOrigin: string;
  tokens: TokenStore;
  getDeviceId: () => Promise<string>;
  getLocale: () => Locale;
  /** Обновить токен не удалось — сессия закончилась, приложение уводит на вход. */
  onSessionExpired: () => void;
  fetchImpl?: typeof fetch;
}

// На эти пути 401 означает «неверные данные», а не «истёк токен» — обновлять токен не нужно.
const NO_REFRESH_PATHS: string[] = [
  MOBILE_AUTH.login,
  MOBILE_AUTH.refresh,
  MOBILE_AUTH.logout,
  '/api/v1/auth/register',
];

export function createApiClient(deps: ApiClientDeps) {
  const fetchImpl = deps.fetchImpl ?? ((input, init) => fetch(input, init));

  // Одно обновление на все параллельные запросы (ТЗ 5.2): остальные ждут этот же промис.
  let refreshInFlight: Promise<string | null> | null = null;

  async function send(request: Request, accessToken: string | null) {
    const headers = new Headers(request.headers);
    headers.set('X-Locale', deps.getLocale());
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    try {
      // Cookie приложение не использует (ТЗ 5.2).
      return await fetchImpl(new Request(request, { headers, credentials: 'omit' }));
    } catch {
      throw ApiError.network();
    }
  }

  /** POST /mobile/auth/* — этих путей пока нет в schema.d.ts, поэтому мимо openapi-fetch. */
  async function postMobileAuth(path: string, body: object) {
    try {
      return await fetchImpl(`${deps.apiOrigin}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Locale': deps.getLocale() },
        body: JSON.stringify(body),
        credentials: 'omit',
      });
    } catch {
      throw ApiError.network();
    }
  }

  async function doRefresh(): Promise<string | null> {
    const refreshToken = await deps.tokens.getRefreshToken();
    if (!refreshToken) return null;

    const body: MobileRefreshRequest = {
      refresh_token: refreshToken,
      device_id: await deps.getDeviceId(),
    };
    // Нет сети — postMobileAuth бросит ApiError('network'), сессию при этом не сбрасываем.
    const response = await postMobileAuth(MOBILE_AUTH.refresh, body);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) return null;
      throw ApiError.fromResponse(response.status, await readJson(response));
    }
    // Старый refresh-токен уже недействителен — сохраняем новую пару целиком.
    const pair = (await response.json()) as MobileTokenPair;
    await deps.tokens.setTokens({
      accessToken: pair.access_token,
      refreshToken: pair.refresh_token,
    });
    return pair.access_token;
  }

  /** Обновить access-токен. null — сессия закончилась. */
  function refreshSession(): Promise<string | null> {
    refreshInFlight ??= doRefresh().finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
  }

  async function authFetch(request: Request): Promise<Response> {
    // Копия до отправки: тело запроса читается один раз, а повтор может понадобиться.
    const retryRequest = request.clone();
    const usedToken = await deps.tokens.getAccessToken();
    const response = await send(request, usedToken);

    const path = new URL(request.url).pathname;
    if (response.status !== 401 || !usedToken || NO_REFRESH_PATHS.includes(path)) {
      return response;
    }

    // Пока этот запрос летел, токен мог обновить другой запрос — тогда просто повторяем с новым.
    const current = await deps.tokens.getAccessToken();
    const freshToken = current && current !== usedToken ? current : await refreshSession();
    if (!freshToken) {
      await deps.tokens.clear();
      deps.onSessionExpired();
      return response;
    }
    return send(retryRequest, freshToken);
  }

  async function login(email: string, password: string) {
    const response = await postMobileAuth(MOBILE_AUTH.login, {
      email,
      password,
      device_id: await deps.getDeviceId(),
    });
    if (!response.ok) {
      throw ApiError.fromResponse(response.status, await readJson(response));
    }
    const result = (await response.json()) as MobileLoginResponse;
    await deps.tokens.setTokens({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    });
    return result.profile;
  }

  /** Отозвать токен этого устройства (если получится) и в любом случае стереть токены локально. */
  async function logout() {
    try {
      const refreshToken = await deps.tokens.getRefreshToken();
      if (refreshToken) {
        const body: MobileLogoutRequest = {
          refresh_token: refreshToken,
          device_id: await deps.getDeviceId(),
        };
        await postMobileAuth(MOBILE_AUTH.logout, body);
      }
    } catch {
      // Нет сети — локальный выход важнее.
    } finally {
      await deps.tokens.clear();
    }
  }

  const api = createClient<paths>({ baseUrl: deps.apiOrigin, fetch: authFetch });

  return { api, refreshSession, login, logout };
}

export type ApiClient = ReturnType<typeof createApiClient>['api'];

/**
 * Результат вызова openapi-fetch → данные или ApiError.
 * Пример: `const profile = await unwrap(api.GET('/api/v1/profile'))`.
 */
export async function unwrap<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let result: Awaited<typeof call>;
  try {
    result = await call;
  } catch (error) {
    throw error instanceof ApiError ? error : ApiError.network();
  }
  if (!result.response.ok) {
    throw ApiError.fromResponse(result.response.status, result.error);
  }
  return result.data as T;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
