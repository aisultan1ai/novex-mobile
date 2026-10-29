import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { api, unwrap } from '@/api';

import { isFinal, toLiveState } from './liveState';
import { useTrackedShipments } from './trackedShipments';

const REFRESH_MS = 60_000;

/** Нормализация ввода: пробелы и дефисы из письма/SMS не мешают поиску. */
export const normalizeTrackingNumber = (raw: string) => raw.replace(/[\s-]+/g, '').toUpperCase();

/**
 * Публичный трекинг (без входа). Пока отправление в пути — обновляется раз в минуту.
 * Последнее состояние сохраняется: без сети экран покажет его с «обновлено N минут назад».
 */
export function usePublicTracking(trackingNumber: string) {
  const upsert = useTrackedShipments((s) => s.upsert);
  const cached = useTrackedShipments((s) => s.byNumber[trackingNumber]);

  const query = useQuery({
    queryKey: ['tracking', trackingNumber],
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/tracking/{tracking_number}', {
          params: { path: { tracking_number: trackingNumber } },
        }),
      ),
    enabled: trackingNumber.length > 0,
    refetchInterval: (q) =>
      q.state.data && isFinal(toLiveState(q.state.data)) ? false : REFRESH_MS,
  });

  useEffect(() => {
    if (query.data) upsert(toLiveState(query.data));
  }, [query.data, upsert]);

  return {
    query,
    /** Свежие данные, а без сети — последние сохранённые. */
    state: query.data ? toLiveState(query.data) : (cached ?? null),
    events: query.data?.events ?? null,
    isStale: !query.data && !!cached,
  };
}
