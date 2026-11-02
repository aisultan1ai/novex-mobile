import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes, spacing } from './tokens';

/** Отступ плавающего таб-бара iOS от низа экрана сверх safe area. */
export const TAB_BAR_FLOAT_GAP = 12;

/**
 * Сколько места снизу занимает таб-бар (DESIGN-TZ 4, TabBar): iOS — плавающая капсула
 * navBar + safe area + 12 и ещё 16 воздуха до контента; Android — панель 72 на всю ширину + safe area.
 */
export function tabBarInset(safeBottom: number): number {
  return Platform.OS === 'android'
    ? sizes.navBarAndroid + safeBottom
    : sizes.navBar + safeBottom + TAB_BAR_FLOAT_GAP + spacing.md;
}

export function useTabBarInset(): number {
  return tabBarInset(useSafeAreaInsets().bottom);
}
