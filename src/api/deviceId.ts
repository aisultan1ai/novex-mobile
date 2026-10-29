import { randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'novex.device_id';

let cached: Promise<string> | null = null;

/** Случайный UUID устройства (ТЗ 5.2): создаётся при первом запуске, дальше не меняется. */
export function getDeviceId(): Promise<string> {
  cached ??= (async () => {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) return stored;
    const id = randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    return id;
  })().catch((error: unknown) => {
    cached = null;
    throw error;
  });
  return cached;
}
