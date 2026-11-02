import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '@/api';
import type { components } from '@/api/schema';
import { describeStatus } from '@/lib/orderStatus';
import { useSessionStore } from '@/store/session';

export type Order = components['schemas']['OrderDraftResponse'];
export type OrderFilter = 'active' | 'delivered' | 'cancelled';

export const orderKeys = { list: ['orders'] as const };

// Одна страница до 100 заказов: фильтры и поиск — на клиенте, без повторных запросов.
// Пагинация понадобится, когда у компаний появятся сотни отправлений (ТЗ 6.4.7).
const PAGE_SIZE = 100;

export function useOrders() {
  const signedIn = useSessionStore((s) => s.status === 'signedIn');
  return useQuery({
    queryKey: orderKeys.list,
    queryFn: () =>
      unwrap(api.GET('/api/v1/orders', { params: { query: { page: 1, size: PAGE_SIZE } } })),
    enabled: signedIn,
  });
}

/** Куда попадает заказ во вкладках «Активные / Доставлены / Отменены». */
export function orderFilter(order: Pick<Order, 'status'>): OrderFilter {
  const { group } = describeStatus(order.status);
  if (group === 'delivered') return 'delivered';
  if (group === 'cancelled' || order.status === 'returned') return 'cancelled';
  return 'active';
}

/** Поиск по трек-номеру, получателю и городам; регистр не важен. */
export function matchesSearch(order: Order, query: string): boolean {
  const q = query.trim().toLocaleLowerCase('ru');
  if (!q) return true;
  return [
    order.tracking_number,
    order.recipient?.full_name,
    order.from_city_snapshot,
    order.to_city_snapshot,
    String(order.draft_id),
  ].some((v) => v?.toLocaleLowerCase('ru').includes(q));
}

/** Доставленные/отменённые — по месяцам, свежие первыми. */
export function groupByMonth(orders: Order[]): { key: string; date: string; items: Order[] }[] {
  const groups = new Map<string, { key: string; date: string; items: Order[] }>();
  for (const order of [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const key = order.created_at.slice(0, 7);
    if (!groups.has(key)) groups.set(key, { key, date: order.created_at, items: [] });
    groups.get(key)!.items.push(order);
  }
  return [...groups.values()];
}
