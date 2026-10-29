import type { components } from './schema';

type ValidationError = components['schemas']['ValidationError'];

export type ApiErrorKind =
  | 'network' // нет сети или сервер недоступен
  | 'unauthorized' // 401 после неудачного обновления токена
  | 'validation' // 422 — ошибки по полям
  | 'rate_limit' // 429 — не повторять автоматически
  | 'server' // 5xx
  | 'http'; // прочие 4xx с текстом в detail

/**
 * Ошибка API в одном виде для всех экранов (ТЗ 5.4).
 * `message` — текст от бэкенда на языке пользователя; пустой — экран показывает свой текст по `kind`.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  /** 422: поле формы → текст ошибки. Ключ — последний элемент `loc`. */
  readonly fieldErrors: Record<string, string>;

  constructor(
    kind: ApiErrorKind,
    status: number | null,
    message = '',
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** Имеет смысл повторить запрос (кнопка «Повторить» или автоповтор react-query). */
  get isRetryable() {
    return this.kind === 'network' || this.kind === 'server';
  }

  static network() {
    return new ApiError('network', null);
  }

  /** `body` — уже разобранное тело ответа (openapi-fetch отдаёт его в `error`). */
  static fromResponse(status: number, body: unknown): ApiError {
    const detail = isObject(body) ? body.detail : undefined;

    if (status === 422 && Array.isArray(detail)) {
      const fieldErrors: Record<string, string> = {};
      for (const item of detail as ValidationError[]) {
        const field = item.loc[item.loc.length - 1];
        if (field !== undefined && !(String(field) in fieldErrors)) {
          fieldErrors[String(field)] = item.msg;
        }
      }
      return new ApiError('validation', status, '', fieldErrors);
    }

    const message = typeof detail === 'string' ? detail : '';
    if (status === 401) return new ApiError('unauthorized', status, message);
    if (status === 429) return new ApiError('rate_limit', status, message);
    if (status >= 500) return new ApiError('server', status, message);
    return new ApiError('http', status, message);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
