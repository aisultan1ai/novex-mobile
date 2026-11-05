import { Stack } from 'expo-router';

import { useColors } from '@/ui';

/**
 * Вход, регистрация, восстановление пароля и подтверждение email — одно модальное окно
 * (app/_layout.tsx): «Назад» ходит внутри него, «Закрыть» убирает его целиком.
 * Адреса без префикса группы: /sign-in, /register, /verify-email?token=…, /reset-password?token=… —
 * последние два совпадают с путями ссылок из писем сайта (deep links, этап 3).
 */
export default function AuthLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
