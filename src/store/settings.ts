import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Locale } from '@/api/client';

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
  /** null — язык ещё не выбран (первый запуск). */
  locale: Locale | null;
  theme: ThemePreference;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemePreference) => void;
}

// Только несекретные настройки. Токены — в expo-secure-store (src/api/tokens.ts).
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: null,
      theme: 'system',
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'novex.settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ locale, theme }) => ({ locale, theme }),
    },
  ),
);
