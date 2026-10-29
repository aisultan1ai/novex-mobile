import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { syncLiveActivity } from './liveActivity';
import type { ShipmentLiveState } from './liveState';

const RECENT_LIMIT = 10;

interface TrackedShipmentsState {
  /** Последнее известное состояние по трек-номеру — работает и без сети (ТЗ 7, офлайн). */
  byNumber: Record<string, ShipmentLiveState>;
  /** Недавние трек-номера, свежие первыми. */
  recent: string[];
  upsert: (state: ShipmentLiveState) => void;
  forget: (trackingNumber: string) => void;
}

/**
 * Все изменения статусов проходят через upsert — единственное место, откуда уходят
 * обновления в Live Activity (а позже — в виджет и локальные уведомления).
 */
export const useTrackedShipments = create<TrackedShipmentsState>()(
  persist(
    (set, get) => ({
      byNumber: {},
      recent: [],
      upsert: (next) => {
        const prev = get().byNumber[next.trackingNumber];
        set((s) => ({
          byNumber: { ...s.byNumber, [next.trackingNumber]: next },
          recent: [next.trackingNumber, ...s.recent.filter((n) => n !== next.trackingNumber)].slice(
            0,
            RECENT_LIMIT,
          ),
        }));
        syncLiveActivity(prev, next);
      },
      forget: (trackingNumber) =>
        set((s) => {
          const { [trackingNumber]: _removed, ...byNumber } = s.byNumber;
          return { byNumber, recent: s.recent.filter((n) => n !== trackingNumber) };
        }),
    }),
    {
      name: 'novex.trackedShipments',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byNumber, recent }) => ({ byNumber, recent }),
    },
  ),
);
