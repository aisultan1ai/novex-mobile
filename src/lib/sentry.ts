import * as Sentry from '@sentry/react-native';

import { config } from '@/config';

import { scrub } from './scrub';

export function initSentry() {
  if (!config.sentryDsn) return;
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.appEnv,
    sendDefaultPii: false,
    beforeSend: (event) => scrub(event),
    beforeBreadcrumb: (breadcrumb) => scrub(breadcrumb),
  });
}

export { Sentry };
