import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { UseFormReturn } from 'react-hook-form';

import { haptics } from '@/lib/haptics';

import { ADDRESS_FIELDS, type AddressFormValues } from './addressForm';
import { parseAddress } from './parseAddress';

/** Сколько символов должно появиться за одно изменение, чтобы считать это вставкой, а не набором. */
const MIN_PASTE_LENGTH = 6;

export interface SmartPasteResult {
  /** Какие поля заполнила вставка — для подсветки и текста «Разложили по полям». */
  fields: (keyof AddressFormValues)[];
  /** Значения до вставки — для «Отменить». */
  previous: AddressFormValues;
}

export interface UseSmartPasteOptions {
  /** Во вставленном тексте нашёлся телефон — форма получателя может подставить его в своё поле. */
  onPhone?: (phone: string) => void;
}

/**
 * Smart Paste для адресной формы на react-hook-form.
 *
 * - `onStreetChangeText` — повесить на поле «Улица» вместо обычного onChange: если туда вставили
 *   целый адрес («Абая 150, кв 45»), он раскладывается по полям, а в «Улице» остаётся только улица.
 *   В React Native нет события paste, поэтому вставку узнаём по скачку длины текста.
 * - `pasteFromClipboard` — кнопка «Вставить адрес». Буфер читается только по нажатию: на iOS
 *   чтение показывает системный запрос, без явного действия пользователя он выглядит подозрительно.
 * - `undo` — вернуть поля как было, если разбор ошибся.
 */
export function useSmartPaste(
  form: UseFormReturn<AddressFormValues>,
  { onPhone }: UseSmartPasteOptions = {},
) {
  const [result, setResult] = useState<SmartPasteResult | null>(null);
  const [clipboardHasText, setClipboardHasText] = useState(false);
  const previousStreet = useRef(form.getValues('street'));

  const apply = useCallback(
    (text: string): boolean => {
      const parsed = parseAddress(text);
      if (!parsed) return false;

      const previous = form.getValues();
      const fields: (keyof AddressFormValues)[] = [];
      for (const name of ADDRESS_FIELDS) {
        const value = parsed[name];
        if (!value) continue;
        form.setValue(name, value, { shouldDirty: true, shouldValidate: true });
        fields.push(name);
      }
      if (parsed.phone) onPhone?.(parsed.phone);

      previousStreet.current = form.getValues('street');
      haptics.select();
      setResult({ fields, previous });
      return true;
    },
    [form, onPhone],
  );

  const onStreetChangeText = useCallback(
    (next: string) => {
      const inserted = next.length - previousStreet.current.length;
      if (inserted >= MIN_PASTE_LENGTH && /\d/.test(next) && apply(next)) return;
      previousStreet.current = next;
      form.setValue('street', next, { shouldDirty: true });
    },
    [apply, form],
  );

  const pasteFromClipboard = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    const ok = text ? apply(text) : false;
    if (!ok) haptics.error();
    return ok;
  }, [apply]);

  const undo = useCallback(() => {
    if (!result) return;
    for (const name of result.fields) {
      form.setValue(name, result.previous[name], { shouldDirty: true, shouldValidate: true });
    }
    previousStreet.current = result.previous.street;
    setResult(null);
  }, [form, result]);

  // hasStringAsync не показывает системный запрос — можно проверять при каждом возврате в приложение.
  useEffect(() => {
    const check = () => {
      Clipboard.hasStringAsync()
        .then(setClipboardHasText)
        .catch(() => setClipboardHasText(false));
    };
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, []);

  return {
    onStreetChangeText,
    pasteFromClipboard,
    clipboardHasText,
    result,
    undo,
    dismiss: () => setResult(null),
  };
}
