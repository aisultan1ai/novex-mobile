import type { TFunction } from 'i18next';
import type { FieldError } from 'react-hook-form';

import { haptics } from '@/lib/haptics';

/**
 * В схемах zod сообщения об ошибках — ключи переводов (`validation.required`),
 * экран переводит их здесь. Так текст меняется вместе с языком без пересоздания схемы.
 */
export function fieldError(t: TFunction, error: FieldError | undefined): string | undefined {
  if (!error?.message) return undefined;
  return t(error.message as never);
}

/** Второй аргумент handleSubmit: форма не прошла проверку — жёсткая двойная вибрация. */
export function onInvalidForm() {
  haptics.error();
}
