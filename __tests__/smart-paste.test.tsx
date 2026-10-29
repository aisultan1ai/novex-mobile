import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { useForm } from 'react-hook-form';

import { emptyAddress, type AddressFormValues } from '@/features/address/addressForm';
import { useSmartPaste } from '@/features/address/useSmartPaste';

jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(),
  hasStringAsync: jest.fn(async () => true),
}));
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => undefined),
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
}));

function setup(onPhone?: (phone: string) => void) {
  return renderHook(() => {
    const form = useForm<AddressFormValues>({ defaultValues: emptyAddress });
    const paste = useSmartPaste(form, { onPhone });
    return { form, paste };
  });
}

describe('useSmartPaste', () => {
  it('вставка целого адреса в «Улицу» раскладывается по полям', async () => {
    const { result } = await setup();
    await waitFor(() => expect(result.current.paste.clipboardHasText).toBe(true));

    await act(() => result.current.paste.onStreetChangeText('г. Алматы, ул. Абая 150, кв 45'));

    expect(result.current.form.getValues()).toMatchObject({
      city: 'Алматы',
      street: 'ул. Абая',
      house: '150',
      apartment: '45',
    });
    expect(result.current.paste.result?.fields).toEqual(['city', 'street', 'house', 'apartment']);
  });

  it('посимвольный набор не перехватывается, даже если похож на адрес', async () => {
    const { result } = await setup();
    let typed = '';
    for (const ch of 'Абая 150, кв 45') {
      typed += ch;
      await act(() => result.current.paste.onStreetChangeText(typed));
    }
    expect(result.current.form.getValues('street')).toBe('Абая 150, кв 45');
    expect(result.current.form.getValues('house')).toBe('');
    expect(result.current.paste.result).toBeNull();
  });

  it('вставка текста, который не адрес, просто попадает в поле', async () => {
    const { result } = await setup();
    await act(() => result.current.paste.onStreetChangeText('Проспект Назарбаева'));
    expect(result.current.form.getValues('street')).toBe('Проспект Назарбаева');
    expect(result.current.paste.result).toBeNull();
  });

  it('«Отменить» возвращает поля как было', async () => {
    const { result } = await setup();
    await act(() => result.current.form.setValue('apartment', '7'));
    await act(() => result.current.paste.onStreetChangeText('Абая 150, кв 45'));
    expect(result.current.form.getValues('apartment')).toBe('45');

    await act(() => result.current.paste.undo());

    expect(result.current.form.getValues()).toMatchObject({ street: '', house: '', apartment: '7' });
    expect(result.current.paste.result).toBeNull();
  });

  it('кнопка «Вставить адрес» читает буфер и отдаёт телефон наружу', async () => {
    (Clipboard.getStringAsync as jest.Mock).mockResolvedValue('Абая 150, кв 45, +77011234567');
    const onPhone = jest.fn();
    const { result } = await setup(onPhone);

    let ok = false;
    await act(async () => {
      ok = await result.current.paste.pasteFromClipboard();
    });

    expect(ok).toBe(true);
    expect(result.current.form.getValues('house')).toBe('150');
    expect(onPhone).toHaveBeenCalledWith('+7 701 123 45 67');
  });

  it('в буфере не адрес → false, поля не трогаем', async () => {
    (Clipboard.getStringAsync as jest.Mock).mockResolvedValue('просто текст');
    const { result } = await setup();
    let ok = true;
    await act(async () => {
      ok = await result.current.paste.pasteFromClipboard();
    });
    expect(ok).toBe(false);
    expect(result.current.form.getValues('street')).toBe('');
  });
});
