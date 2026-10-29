import { config } from '@/config';
import { currentLocale } from '@/i18n';
import { useSessionStore } from '@/store/session';

import { createApiClient } from './client';
import { getDeviceId } from './deviceId';
import { withMobileAuthMock } from './mobileAuth';
import { createSecureTokenStore } from './tokens';

export { ApiError } from './errors';
export { unwrap } from './client';
export type { Locale } from './client';

export const tokens = createSecureTokenStore();

const realFetch: typeof fetch = (input, init) => fetch(input, init);

export const apiClient = createApiClient({
  apiOrigin: config.apiOrigin,
  tokens,
  getDeviceId,
  getLocale: currentLocale,
  onSessionExpired: () => useSessionStore.getState().setStatus('signedOut'),
  fetchImpl: config.mockMobileAuth ? withMobileAuthMock(realFetch) : realFetch,
});

export const { api } = apiClient;
