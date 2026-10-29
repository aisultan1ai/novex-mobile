// ТЗ 7: не отправлять токены, пароли, ИИН/БИН, телефоны — в том числе в Sentry.
const SENSITIVE_KEY = /token|password|authorization|cookie|tax_id|iin|bin$|phone|secret/i;
const REDACTED = '[скрыто]';

/** Рекурсивно заменяет значения чувствительных полей. Не меняет исходный объект. */
export function scrub<T>(value: T, depth = 0): T {
  if (depth > 8 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => scrub(item, depth + 1)) as T;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrub(item, depth + 1);
  }
  return result as T;
}
