import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const LIMIT = 5;

interface RecentCitiesState {
  /** Русские value последних выбранных городов, свежие первыми. */
  cities: string[];
  remember: (city: string) => void;
}

export const useRecentCities = create<RecentCitiesState>()(
  persist(
    (set) => ({
      cities: [],
      remember: (city) =>
        set((s) => ({ cities: [city, ...s.cities.filter((c) => c !== city)].slice(0, LIMIT) })),
    }),
    {
      name: 'novex.recentCities',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ cities }) => ({ cities }),
    },
  ),
);
