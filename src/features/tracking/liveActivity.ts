import { hasVisibleChange, isFinal, wantsLiveActivity, type ShipmentLiveState } from './liveState';

/**
 * Точка расширения под iOS Live Activities / Dynamic Island.
 *
 * Сейчас — заглушка. Чтобы включить:
 *  1. Нативный Expo-модуль (Swift, ActivityKit) + Widget Extension через config plugin.
 *     ContentState в Swift повторяет поля ShipmentLiveState, которые нужны виджету
 *     (phase, status, toCity, etaTo, lastEvent).
 *  2. Реализовать этот интерфейс поверх модуля и вызвать setLiveActivityBridge() при старте.
 *  3. Для обновлений в фоне — push-токен активности на бэкенд (развитие задачи B2),
 *     бэкенд шлёт APNs `liveactivity` при смене статуса.
 * Остальной код (store, экраны) менять не придётся: он уже сообщает сюда каждое изменение.
 */
export interface LiveActivityBridge {
  /** Начать активность или обновить её содержимое. */
  upsert(state: ShipmentLiveState): Promise<void>;
  /** Завершить активность: доставлено, отменено или перестало быть «в пути». */
  end(trackingNumber: string, finalState: ShipmentLiveState | null): Promise<void>;
}

const noopBridge: LiveActivityBridge = {
  upsert: async () => undefined,
  end: async () => undefined,
};

let bridge: LiveActivityBridge = noopBridge;

export function setLiveActivityBridge(next: LiveActivityBridge | null) {
  bridge = next ?? noopBridge;
}

/**
 * Решает, что сделать с активностью при смене состояния отправления.
 * Чистая логика отделена от моста, чтобы её можно было проверить тестом.
 */
export function planLiveActivity(
  prev: ShipmentLiveState | undefined,
  next: ShipmentLiveState,
): 'upsert' | 'end' | 'none' {
  if (wantsLiveActivity(next)) return hasVisibleChange(prev, next) ? 'upsert' : 'none';
  if (prev && wantsLiveActivity(prev) && (isFinal(next) || !wantsLiveActivity(next))) return 'end';
  return 'none';
}

export function syncLiveActivity(prev: ShipmentLiveState | undefined, next: ShipmentLiveState) {
  const action = planLiveActivity(prev, next);
  // Сбой нативной части не должен ломать экран трекинга.
  if (action === 'upsert') bridge.upsert(next).catch(() => undefined);
  if (action === 'end') bridge.end(next.trackingNumber, next).catch(() => undefined);
}
