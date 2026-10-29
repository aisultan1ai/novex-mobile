import type { components } from '@/api/schema';

export type OrderStatus = components['schemas']['OrderDraftResponse']['status'];

/** Группа статусов в приложении (ТЗ 5.7). Ключ совпадает с `statusGroup.*` в переводах. */
export type StatusGroup =
  | 'processing'
  | 'preparing'
  | 'awaitingPayment'
  | 'paymentReview'
  | 'handover'
  | 'inTransit'
  | 'problem'
  | 'delivered'
  | 'return'
  | 'cancelled';

/** Цвет бейджа — токен из src/ui/tokens.ts (`colors.status.*`). */
export type StatusTone = 'neutral' | 'transit' | 'danger' | 'success';

// Record по типу из схемы: новый статус в openapi.json без строки здесь — ошибка компиляции.
const GROUP_BY_STATUS: Record<OrderStatus, StatusGroup> = {
  draft: 'preparing',
  shipment_details_completed: 'preparing',
  ready_for_checkout: 'preparing',
  awaiting_payment: 'awaitingPayment',
  payment_rejected: 'awaitingPayment',
  payment_under_review: 'paymentReview',
  paid: 'handover',
  dispatch_queued: 'handover',
  dispatch_failed: 'handover',
  pending_manual: 'handover',
  pending_manual_dispatch: 'handover',
  sent_to_carrier: 'inTransit',
  picked_up: 'inTransit',
  in_transit: 'inTransit',
  arrived: 'inTransit',
  out_for_delivery: 'inTransit',
  customs_hold: 'inTransit',
  delivery_failed: 'problem',
  delivered: 'delivered',
  return_requested: 'return',
  return_in_progress: 'return',
  returned: 'return',
  cancelled: 'cancelled',
};

const TONE_BY_GROUP: Record<StatusGroup, StatusTone> = {
  processing: 'neutral',
  preparing: 'neutral',
  awaitingPayment: 'neutral',
  paymentReview: 'neutral',
  handover: 'neutral',
  inTransit: 'transit',
  problem: 'danger',
  delivered: 'success',
  return: 'neutral',
  cancelled: 'neutral',
};

export function isKnownStatus(status: string): status is OrderStatus {
  return Object.prototype.hasOwnProperty.call(GROUP_BY_STATUS, status);
}

/**
 * Статус из API → группа и цвет. Принимает string: публичный трекинг отдаёт статус без enum,
 * а бэкенд может добавить новый. Неизвестный статус → «Обрабатывается».
 */
export function describeStatus(status: string): { group: StatusGroup; tone: StatusTone } {
  const group = isKnownStatus(status) ? GROUP_BY_STATUS[status] : 'processing';
  return { group, tone: TONE_BY_GROUP[group] };
}
