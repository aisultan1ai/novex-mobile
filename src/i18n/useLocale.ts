import { useTranslation } from 'react-i18next';

import type { Locale } from '@/api/client';

/** Текущий язык интерфейса; компонент перерисуется при смене языка. */
export function useLocale(): Locale {
  const { i18n } = useTranslation();
  return i18n.language === 'kk' ? 'kk' : 'ru';
}
