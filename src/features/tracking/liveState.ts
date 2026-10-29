import type { components } from '@/api/schema';
import { describeStatus, type StatusGroup, type StatusTone } from '@/lib/orderStatus';

export type PublicTracking = components['schemas']['PublicTrackingResponse'];

/**
 * Фаза доставки глазами получателя. Именно её покажут Dynamic Island и Live Activity:
 * там нет места для 23 статусов API, нужны 4–5 понятных состояний.
 */
export type LivePhase =
  | 'preparing' // оформляется / оплачивается / передаётся перевозчику
  | 'onTheWay' // у перевозчика, едет между городами
  | 'outForDelivery' // «Курьер в пути» — главный кандидат для Dynamic Island
  | 'problem' // попытка доставки не удалась
  | 'delivered'
  | 'closed'; // отмена или возврат

/**
 * Нормализованное состояние отправления — единый источник для экрана трекинга, офлайн-кэша,
 * уведомлений и (в будущем) нативной Live Activity. Только сериализуемые поля: состояние
 * целиком уходит в ActivityKit как ContentState и в AsyncStorage как есть.
 */
export interface ShipmentLiveState {
  trackingNumber: string;
  carrierName: string;
  fromCity: string;
  toCity: string;
  /** Статус как пришёл из API (для подписи «Выезд на доставку»). */
  status: string;
  group: StatusGroup;
  tone: StatusTone;
  phase: LivePhase;
  /** Плановое окно доставки, ISO-даты. */
  etaFrom: string | null;
  etaTo: string | null;
  deliveredAt: string | null;
  lastEvent: { description: string | null; location: string | null; at: string } | null;
  /** Когда приложение получило эти данные — для «обновлено N минут назад». */
  fetchedAt: string;
}

export function phaseOf(status: string): LivePhase {
  if (status === 'out_for_delivery') return 'outForDelivery';
  const { group } = describeStatus(status);
  switch (group) {
    case 'inTransit':
      return 'onTheWay';
    case 'problem':
      return 'problem';
    case 'delivered':
      return 'delivered';
    case 'return':
    case 'cancelled':
      return 'closed';
    default:
      return 'preparing';
  }
}

const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export function toLiveState(data: PublicTracking, now: Date = new Date()): ShipmentLiveState {
  const { group, tone } = describeStatus(data.order_status);
  const events = [...data.events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  const last = events[0];
  const phase = phaseOf(data.order_status);
  const open = phase !== 'delivered' && phase !== 'closed';
  return {
    trackingNumber: data.tracking_number,
    carrierName: data.carrier_name,
    fromCity: data.from_city,
    toCity: data.to_city,
    status: data.order_status,
    group,
    tone,
    phase,
    etaFrom: open ? addDays(data.created_at, data.eta_days_min) : null,
    etaTo: open ? addDays(data.created_at, data.eta_days_max) : null,
    deliveredAt: data.delivery?.delivered_at ?? null,
    lastEvent: last
      ? { description: last.description, location: last.location, at: last.occurred_at }
      : null,
    fetchedAt: now.toISOString(),
  };
}

export const isFinal = (state: Pick<ShipmentLiveState, 'phase'>) =>
  state.phase === 'delivered' || state.phase === 'closed';

/** Показывать ли отправление в Live Activity (только пока оно реально движется к получателю). */
export const wantsLiveActivity = (state: Pick<ShipmentLiveState, 'phase'>) =>
  state.phase === 'onTheWay' || state.phase === 'outForDelivery';

/** Изменилось ли то, что видит пользователь (а не только время запроса). */
export function hasVisibleChange(prev: ShipmentLiveState | undefined, next: ShipmentLiveState) {
  return (
    !prev ||
    prev.status !== next.status ||
    prev.etaTo !== next.etaTo ||
    prev.lastEvent?.at !== next.lastEvent?.at
  );
}
