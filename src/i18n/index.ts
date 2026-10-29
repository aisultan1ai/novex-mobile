import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { Locale } from '@/api/client';

import kk from './kk.json';
import ru from './ru.json';

export const LOCALES: readonly Locale[] = ['ru', 'kk'];

export const resources = {
  ru: { translation: ru },
  kk: { translation: kk },
} as const;

/** Язык устройства, если это kk, иначе ru. Используется до выбора языка в приложении. */
export function deviceLocale(): Locale {
  return getLocales().some((l) => l.languageCode === 'kk') ? 'kk' : 'ru';
}

const i18n = createInstance();

export function currentLocale(): Locale {
  return i18n.language === 'kk' ? 'kk' : 'ru';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: deviceLocale(),
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
