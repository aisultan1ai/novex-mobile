import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/api';
import { useSessionStore } from '@/store/session';

export const notificationKeys = { list: ['notifications'] as const };

/** Лента уведомлений; гостю не запрашивается (эндпоинт только для вошедших). */
export function useNotifications() {
  const signedIn = useSessionStore((s) => s.status === 'signedIn');
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => unwrap(api.GET('/api/v1/notifications')),
    enabled: signedIn,
    staleTime: 60_000,
  });
}

/** Есть ли непрочитанные — для точки на вкладке и колокольчике в шапке. */
export function useHasUnread(): boolean {
  return (useNotifications().data?.unread_count ?? 0) > 0;
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(
        api.PATCH('/api/v1/notifications/{notification_id}/read', {
          params: { path: { notification_id: id } },
        }),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.list }),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.POST('/api/v1/notifications/read-all')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.list }),
  });
}
