import { createApiClient, unwrap, type Locale } from '@/api/client';
import { ApiError } from '@/api/errors';
import { withMobileAuthMock } from '@/api/mobileAuth';
import { createMemoryTokenStore, type TokenStore } from '@/api/tokens';

const ORIGIN = 'https://api.test';
const DEVICE_ID = '0d6f4c1e-7a51-4c8e-9f0a-2b1d3c4e5f60';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const profile = { user_id: 1, email: 'a@b.kz', is_active: true, role: 'customer' };

type Call = {
  path: string;
  auth: string | null;
  locale: string | null;
  credentials: RequestCredentials;
  body?: string;
};

/** Фейковый бэкенд со схемой /mobile/auth/* из ТЗ 5.2. */
function fakeServer(options: { refreshStatus?: number; validToken?: string } = {}) {
  let valid = options.validToken ?? 'new-access';
  let validRefresh = 'r0';
  const calls: Call[] = [];
  let refreshCalls = 0;

  const fetchImpl = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const path = new URL(request.url).pathname;
    const body = request.method === 'GET' ? undefined : await request.text();
    calls.push({
      path,
      auth: request.headers.get('Authorization'),
      locale: request.headers.get('X-Locale'),
      credentials: init?.credentials ?? request.credentials,
      body,
    });

    if (path === '/api/v1/mobile/auth/login') {
      const { password } = JSON.parse(body ?? '{}') as { password: string };
      if (password !== 'secret') return json(401, { detail: 'Неверный email или пароль' });
      valid = 'login-access';
      validRefresh = 'login-refresh';
      return json(200, {
        access_token: valid,
        refresh_token: validRefresh,
        expires_in: 3600,
        profile,
      });
    }
    if (path === '/api/v1/mobile/auth/refresh') {
      refreshCalls += 1;
      // Ответ не мгновенный, чтобы параллельные запросы успели встать в очередь.
      await new Promise((r) => setTimeout(r, 10));
      const sent = JSON.parse(body ?? '{}') as { refresh_token?: string };
      if (options.refreshStatus && options.refreshStatus !== 200) {
        return json(options.refreshStatus, { detail: 'Сессия истекла' });
      }
      if (sent.refresh_token !== validRefresh) return json(401, { detail: 'Токен отозван' });
      valid = `access-${refreshCalls}`;
      validRefresh = `refresh-${refreshCalls}`;
      return json(200, { access_token: valid, refresh_token: validRefresh, expires_in: 3600 });
    }
    if (path === '/api/v1/mobile/auth/logout') {
      return new Response(null, { status: 204 });
    }
    if (request.headers.get('Authorization') !== `Bearer ${valid}`) {
      return json(401, { detail: 'Не авторизован' });
    }
    return json(200, { status: 'ok' });
  });

  return { fetchImpl, calls, refreshCount: () => refreshCalls };
}

function setup(
  server: ReturnType<typeof fakeServer>,
  tokens: TokenStore = createMemoryTokenStore({ accessToken: 'old-access', refreshToken: 'r0' }),
  locale: Locale = 'kk',
) {
  const onSessionExpired = jest.fn();
  const client = createApiClient({
    apiOrigin: ORIGIN,
    tokens,
    getDeviceId: async () => DEVICE_ID,
    getLocale: () => locale,
    onSessionExpired,
    fetchImpl: server.fetchImpl as unknown as typeof fetch,
  });
  return { ...client, tokens, onSessionExpired };
}

const bodyOf = (call: Call | undefined) => JSON.parse(call?.body ?? '{}') as Record<string, unknown>;

describe('API-клиент: запросы', () => {
  it('добавляет X-Locale и Bearer-токен, cookie не отправляет', async () => {
    const server = fakeServer({ validToken: 'old-access' });
    const { api } = setup(server);

    await unwrap(api.GET('/api/v1/profile'));

    expect(server.calls[0]).toMatchObject({
      path: '/api/v1/profile',
      auth: 'Bearer old-access',
      locale: 'kk',
      credentials: 'omit',
    });
  });

  it('сетевая ошибка → ApiError("network")', async () => {
    const server = fakeServer();
    server.fetchImpl.mockRejectedValue(new TypeError('Network request failed'));
    const { api } = setup(server);

    const error = await unwrap(api.GET('/api/v1/profile')).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'network', isRetryable: true });
  });
});

describe('API-клиент: обновление токена', () => {
  it('при 401 вызывает /mobile/auth/refresh один раз и повторяет запрос', async () => {
    const server = fakeServer();
    const { api, tokens, onSessionExpired } = setup(server);

    const data = await unwrap(api.GET('/api/v1/profile'));

    expect(data).toEqual({ status: 'ok' });
    expect(server.calls.map((c) => c.path)).toEqual([
      '/api/v1/profile',
      '/api/v1/mobile/auth/refresh',
      '/api/v1/profile',
    ]);
    expect(server.calls[2]?.auth).toBe('Bearer access-1');
    expect(onSessionExpired).not.toHaveBeenCalled();
    // Новая пара сохранена целиком: старый refresh-токен больше не работает.
    expect(await tokens.getAccessToken()).toBe('access-1');
    expect(await tokens.getRefreshToken()).toBe('refresh-1');
  });

  it('отправляет refresh_token и device_id, без cookie', async () => {
    const server = fakeServer();
    const { api } = setup(server);

    await unwrap(api.GET('/api/v1/profile'));

    const refreshCall = server.calls.find((c) => c.path === '/api/v1/mobile/auth/refresh');
    expect(bodyOf(refreshCall)).toEqual({ refresh_token: 'r0', device_id: DEVICE_ID });
    expect(refreshCall?.credentials).toBe('omit');
    expect(refreshCall?.auth).toBeNull();
  });

  it('следующее обновление идёт уже с новым refresh-токеном', async () => {
    const server = fakeServer();
    const { refreshSession, tokens } = setup(server);

    await refreshSession();
    await refreshSession();

    const refreshBodies = server.calls
      .filter((c) => c.path === '/api/v1/mobile/auth/refresh')
      .map((c) => bodyOf(c).refresh_token);
    expect(refreshBodies).toEqual(['r0', 'refresh-1']);
    expect(await tokens.getRefreshToken()).toBe('refresh-2');
  });

  it('повторяет тело POST-запроса после обновления токена', async () => {
    const server = fakeServer();
    const { api } = setup(server);

    await unwrap(
      api.POST('/api/v1/profile/change-password', {
        body: { current_password: 'a', new_password: 'b' } as never,
      }),
    );

    const posts = server.calls.filter((c) => c.path === '/api/v1/profile/change-password');
    expect(posts).toHaveLength(2);
    expect(posts[1]?.body).toBe(posts[0]?.body);
  });

  it('параллельные запросы ждут одного обновления', async () => {
    const server = fakeServer();
    const { api } = setup(server);

    const results = await Promise.all([
      unwrap(api.GET('/api/v1/profile')),
      unwrap(api.GET('/api/v1/notifications')),
      unwrap(api.GET('/api/v1/contracts/me')),
    ]);

    expect(results).toHaveLength(3);
    expect(server.refreshCount()).toBe(1);
  });

  it('если обновить не удалось — стирает токены и сообщает об окончании сессии', async () => {
    const server = fakeServer({ refreshStatus: 401 });
    const { api, tokens, onSessionExpired } = setup(server);

    await expect(unwrap(api.GET('/api/v1/profile'))).rejects.toMatchObject({
      kind: 'unauthorized',
      status: 401,
    });
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(await tokens.getAccessToken()).toBeNull();
    expect(await tokens.getRefreshToken()).toBeNull();
  });

  it('без refresh-токена не ходит на сервер, сразу завершает сессию', async () => {
    const server = fakeServer();
    const { api, onSessionExpired } = setup(
      server,
      createMemoryTokenStore({ accessToken: 'old-access' }),
    );

    await expect(unwrap(api.GET('/api/v1/profile'))).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(server.refreshCount()).toBe(0);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('без сети при обновлении не выкидывает на вход', async () => {
    const server = fakeServer();
    server.fetchImpl.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      if (request.url.endsWith('/mobile/auth/refresh')) {
        throw new TypeError('Network request failed');
      }
      return json(401, { detail: 'Не авторизован' });
    });
    const { api, tokens, onSessionExpired } = setup(server);

    await expect(unwrap(api.GET('/api/v1/profile'))).rejects.toMatchObject({ kind: 'network' });
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(await tokens.getAccessToken()).toBe('old-access');
  });

  it('без токена 401 возвращается как есть, без обновления', async () => {
    const server = fakeServer();
    const { api } = setup(server, createMemoryTokenStore());

    await expect(unwrap(api.GET('/api/v1/profile'))).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(server.refreshCount()).toBe(0);
  });
});

describe('API-клиент: вход и выход', () => {
  it('вход отправляет email, пароль и device_id и сохраняет обе части пары', async () => {
    const server = fakeServer();
    const { login, tokens } = setup(server, createMemoryTokenStore());

    const result = await login('a@b.kz', 'secret');

    expect(result).toEqual(profile);
    expect(bodyOf(server.calls[0])).toEqual({
      email: 'a@b.kz',
      password: 'secret',
      device_id: DEVICE_ID,
    });
    expect(server.calls[0]).toMatchObject({ locale: 'kk', credentials: 'omit' });
    expect(await tokens.getAccessToken()).toBe('login-access');
    expect(await tokens.getRefreshToken()).toBe('login-refresh');
  });

  it('неверный пароль → ApiError с текстом бэкенда, без попытки обновить токен', async () => {
    const server = fakeServer();
    const { login, onSessionExpired } = setup(server);

    await expect(login('a@b.kz', 'wrong')).rejects.toMatchObject({
      kind: 'unauthorized',
      message: 'Неверный email или пароль',
    });
    expect(server.calls).toHaveLength(1);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('422 при входе → ошибки по полям', async () => {
    const server = fakeServer();
    server.fetchImpl.mockResolvedValue(
      json(422, { detail: [{ loc: ['body', 'email'], msg: 'Некорректный email', type: 'x' }] }),
    );
    const { login } = setup(server);

    await expect(login('nope', 'secret')).rejects.toMatchObject({
      kind: 'validation',
      fieldErrors: { email: 'Некорректный email' },
    });
  });

  it('выход отзывает токен этого устройства и стирает хранилище', async () => {
    const server = fakeServer();
    const { logout, tokens } = setup(server);

    await logout();

    expect(server.calls[0]?.path).toBe('/api/v1/mobile/auth/logout');
    expect(bodyOf(server.calls[0])).toEqual({ refresh_token: 'r0', device_id: DEVICE_ID });
    expect(await tokens.getAccessToken()).toBeNull();
    expect(await tokens.getRefreshToken()).toBeNull();
  });

  it('выход без сети всё равно стирает токены', async () => {
    const server = fakeServer();
    server.fetchImpl.mockRejectedValue(new TypeError('Network request failed'));
    const { logout, tokens } = setup(server);

    await expect(logout()).resolves.toBeUndefined();
    expect(await tokens.getRefreshToken()).toBeNull();
  });
});

describe('мок /mobile/auth/*', () => {
  function siteBackend() {
    return jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      const path = new URL(request.url).pathname;
      if (path === '/api/v1/auth/login') {
        const { email, password, device_id } = JSON.parse(await request.text()) as Record<
          string,
          string
        >;
        if (device_id !== undefined) return json(422, { detail: 'лишнее поле' });
        if (password !== 'secret') return json(401, { detail: 'Неверный пароль' });
        return json(200, { access_token: `site-${email}`, expires_in: 3600, profile });
      }
      return json(200, { path, auth: request.headers.get('Authorization') });
    });
  }

  it('вход идёт через сайтовый /auth/login, остальные запросы — без изменений', async () => {
    const backend = siteBackend();
    const onSessionExpired = jest.fn();
    const tokens = createMemoryTokenStore();
    const { api, login } = createApiClient({
      apiOrigin: ORIGIN,
      tokens,
      getDeviceId: async () => DEVICE_ID,
      getLocale: () => 'ru',
      onSessionExpired,
      fetchImpl: withMobileAuthMock(backend as unknown as typeof fetch),
    });

    await expect(login('a@b.kz', 'secret')).resolves.toEqual(profile);
    expect(await tokens.getAccessToken()).toBe('site-a@b.kz');

    const data = await unwrap(api.GET('/api/v1/profile'));
    expect(data).toEqual({ path: '/api/v1/profile', auth: 'Bearer site-a@b.kz' });
  });

  it('ошибка входа передаётся как есть; обновление токена недоступно', async () => {
    const backend = siteBackend();
    const { login, refreshSession } = createApiClient({
      apiOrigin: ORIGIN,
      tokens: createMemoryTokenStore({ accessToken: 'a', refreshToken: 'mock-refresh-token' }),
      getDeviceId: async () => DEVICE_ID,
      getLocale: () => 'ru',
      onSessionExpired: jest.fn(),
      fetchImpl: withMobileAuthMock(backend as unknown as typeof fetch),
    });

    await expect(login('a@b.kz', 'wrong')).rejects.toMatchObject({ message: 'Неверный пароль' });
    await expect(refreshSession()).resolves.toBeNull();
  });
});

describe('ApiError.fromResponse', () => {
  it('422 → ошибки по полям', () => {
    const error = ApiError.fromResponse(422, {
      detail: [
        { loc: ['body', 'email'], msg: 'Некорректный email', type: 'value_error' },
        { loc: ['body', 'tax_id'], msg: 'Нужно 12 цифр', type: 'value_error' },
      ],
    });
    expect(error.kind).toBe('validation');
    expect(error.fieldErrors).toEqual({ email: 'Некорректный email', tax_id: 'Нужно 12 цифр' });
  });

  it('429 → rate_limit, не повторяется автоматически', () => {
    const error = ApiError.fromResponse(429, { detail: 'Too many requests' });
    expect(error.kind).toBe('rate_limit');
    expect(error.isRetryable).toBe(false);
  });

  it('5xx → server, текст из detail', () => {
    const error = ApiError.fromResponse(503, { detail: 'Сервис недоступен' });
    expect(error).toMatchObject({ kind: 'server', message: 'Сервис недоступен', isRetryable: true });
  });

  it('тело не JSON → пустой текст', () => {
    expect(ApiError.fromResponse(400, '<html>').message).toBe('');
  });
});
