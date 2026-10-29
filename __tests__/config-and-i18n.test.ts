import { parseApiUrl } from '@/config';
import kk from '@/i18n/kk.json';
import ru from '@/i18n/ru.json';
import { scrub } from '@/lib/scrub';

describe('parseApiUrl', () => {
  it('отделяет origin от /api/v1', () => {
    expect(parseApiUrl('http://192.168.1.10:8000/api/v1/', 'development')).toEqual({
      apiUrl: 'http://192.168.1.10:8000/api/v1',
      apiOrigin: 'http://192.168.1.10:8000',
    });
  });

  it('вне development требует HTTPS', () => {
    expect(() => parseApiUrl('http://novex.kz/api/v1', 'production')).toThrow('HTTPS');
    expect(parseApiUrl('https://novex.kz/api/v1', 'production').apiOrigin).toBe('https://novex.kz');
  });

  it('требует адрес и префикс /api/v1', () => {
    expect(() => parseApiUrl(undefined, 'development')).toThrow();
    expect(() => parseApiUrl('https://novex.kz', 'staging')).toThrow('/api/v1');
  });
});

describe('переводы', () => {
  const keys = (obj: object, prefix = ''): string[] =>
    Object.entries(obj).flatMap(([k, v]) =>
      typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
    );

  it('в ru и kk одинаковый набор ключей', () => {
    expect(keys(kk).sort()).toEqual(keys(ru).sort());
  });
});

describe('scrub для Sentry', () => {
  it('скрывает токены, пароли, ИИН/БИН и телефоны на любой глубине', () => {
    const event = {
      request: { headers: { Authorization: 'Bearer abc', 'X-Locale': 'ru' } },
      extra: {
        body: { password: 'secret', tax_id: '900101300123', phone: '+77010000000', city: 'Алматы' },
        list: [{ refresh_token: 'r' }],
      },
    };
    expect(scrub(event)).toEqual({
      request: { headers: { Authorization: '[скрыто]', 'X-Locale': 'ru' } },
      extra: {
        body: { password: '[скрыто]', tax_id: '[скрыто]', phone: '[скрыто]', city: 'Алматы' },
        list: [{ refresh_token: '[скрыто]' }],
      },
    });
    expect(event.extra.body.password).toBe('secret');
  });
});
