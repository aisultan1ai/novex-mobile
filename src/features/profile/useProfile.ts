import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '@/api';
import { useSessionStore } from '@/store/session';

export const profileKeys = {
  me: ['profile'] as const,
  contract: ['contract'] as const,
  addresses: ['profile', 'addresses'] as const,
};

/** Профиль вошедшего клиента; гостю не запрашивается. */
export function useProfile() {
  const signedIn = useSessionStore((s) => s.status === 'signedIn');
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () => unwrap(api.GET('/api/v1/profile')),
    enabled: signedIn,
    staleTime: 5 * 60_000,
  });
}

/** Договор компании: схема ответа в API не описана (object), поэтому поля читаются осторожно. */
export function useContract(enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.contract,
    queryFn: () => unwrap(api.GET('/api/v1/contracts/me')),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useAddressBook(enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.addresses,
    queryFn: () => unwrap(api.GET('/api/v1/profile/addresses')),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** Инициалы для аватара: «Айгерим Сапарова» → «АС», иначе первая буква email. */
export function initials(fullName: string | null | undefined, email?: string): string {
  const words = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    return words
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase();
  }
  return (email?.[0] ?? '').toUpperCase();
}

/** Имя для приветствия: первое слово полного имени. */
export function firstName(fullName: string | null | undefined): string | null {
  return (fullName ?? '').trim().split(/\s+/)[0] || null;
}
