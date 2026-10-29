import 'i18next';

import type { resources } from './index';

// Ключи t('…') проверяются компилятором: опечатка в ключе — ошибка типов.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: (typeof resources)['ru'];
  }
}
