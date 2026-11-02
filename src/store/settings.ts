import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Locale } from '@/api/client';

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
  /** null — язык ещё не выбран (первый запуск). */
  locale: Locale | null;
  theme: ThemePreference;
  /** Онбординг уже показан (DESIGN-TZ 6.1). */
  onboardingSeen: boolean;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemePreference) => void;
  setOnboardingSeen: () => void;
}

// Только несекретные настройки. Токены — в expo-secure-store (src/api/tokens.ts).
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: null,
      theme: 'system',
      onboardingSeen: false,
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      setOnboardingSeen: () => set({ onboardingSeen: true }),
    }),
    {
      name: 'novex.settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ locale, theme, onboardingSeen }) => ({ locale, theme, onboardingSeen }),
    },
  ),
);

const subscribeHydration = (onChange: () => void) =>
  useSettingsStore.persist.onFinishHydration(() => onChange());
const isHydrated = () => useSettingsStore.persist.hasHydrated();

/** Настройки прочитаны из хранилища — до этого onboardingSeen всегда false, решать по нему рано. */
export function useSettingsHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, isHydrated, isHydrated);
}
