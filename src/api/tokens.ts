import * as SecureStore from 'expo-secure-store';

// Токены живут только в Keychain / Keystore (ТЗ 5.2). AsyncStorage для них не использовать.

export interface TokenStore {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  /** refresh не передан — оставляем прежний. */
  setTokens(tokens: { accessToken: string; refreshToken?: string | null }): Promise<void>;
  clear(): Promise<void>;
}

const ACCESS_KEY = 'novex.access_token';
const REFRESH_KEY = 'novex.refresh_token';

export function createSecureTokenStore(): TokenStore {
  // Кэш в памяти, чтобы не читать Keychain на каждый запрос. undefined — ещё не читали.
  let access: string | null | undefined;

  return {
    async getAccessToken() {
      if (access === undefined) {
        access = await SecureStore.getItemAsync(ACCESS_KEY);
      }
      return access;
    },
    getRefreshToken() {
      return SecureStore.getItemAsync(REFRESH_KEY);
    },
    async setTokens({ accessToken, refreshToken }) {
      access = accessToken;
      await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
      }
    },
    async clear() {
      access = null;
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_KEY),
        SecureStore.deleteItemAsync(REFRESH_KEY),
      ]);
    },
  };
}

export function createMemoryTokenStore(initial?: {
  accessToken?: string;
  refreshToken?: string;
}): TokenStore {
  let access = initial?.accessToken ?? null;
  let refresh = initial?.refreshToken ?? null;
  return {
    getAccessToken: async () => access,
    getRefreshToken: async () => refresh,
    async setTokens({ accessToken, refreshToken }) {
      access = accessToken;
      if (refreshToken) refresh = refreshToken;
    },
    async clear() {
      access = null;
      refresh = null;
    },
  };
}
