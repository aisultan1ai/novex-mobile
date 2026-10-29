import * as Haptics from 'expo-haptics';

// Тактильные отклики по смыслу, а не по типу вибрации: экраны вызывают haptics.select(), а не Haptics.*.
// Ошибки глушим — нет вибромотора или пользователь отключил отклики в системе.

function safe(run: () => Promise<void>) {
  run().catch(() => undefined);
}

export const haptics = {
  /** Лёгкий щелчок: выбор тарифа, переключатель, пресет размера. */
  select: () => safe(() => Haptics.selectionAsync()),
  /** Порог свайпа пройден / перетаскивание «зацепилось». */
  tick: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Ошибка валидации: системная «ошибка» — жёсткая двойная вибрация. */
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** Успех: чек загружен, заказ оформлен — мягкая глубокая вибрация. */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
