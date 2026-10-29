import { useEffect } from 'react';

import { useSettingsStore } from '@/store/settings';

import i18n from './index';

/** Выбранный в приложении язык → i18next. Пока язык не выбран, остаётся язык устройства. */
export function useSyncLocale() {
  const locale = useSettingsStore((s) => s.locale);
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);
}
