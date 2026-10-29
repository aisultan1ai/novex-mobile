import { act } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { renderRouter, screen } from 'expo-router/testing-library';

import TabLayout from '../app/(tabs)/_layout';
import QuoteScreen from '../app/(tabs)/index';
import NotificationsScreen from '../app/(tabs)/notifications';
import OrdersLayout from '../app/(tabs)/orders/_layout';
import OrdersScreen from '../app/(tabs)/orders/index';
import ProfileLayout from '../app/(tabs)/profile/_layout';
import ProfileScreen from '../app/(tabs)/profile/index';
import TrackScreen from '../app/(tabs)/track';
import i18n from '@/i18n';
import { createQueryClient } from '@/lib/queryClient';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
);

const routes = {
  '(tabs)/_layout': TabLayout,
  '(tabs)/index': QuoteScreen,
  '(tabs)/orders/_layout': OrdersLayout,
  '(tabs)/orders/index': OrdersScreen,
  '(tabs)/track': TrackScreen,
  '(tabs)/notifications': NotificationsScreen,
  '(tabs)/profile/_layout': ProfileLayout,
  '(tabs)/profile/index': ProfileScreen,
};

describe('нижняя панель', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('ru'));
  });

  it('пять вкладок на русском, открыт расчёт', async () => {
    await act(() => i18n.changeLanguage('ru'));
    await renderRouter(routes, { initialUrl: '/', wrapper });

    for (const label of ['Расчёт', 'Заказы', 'Отследить', 'Уведомления', 'Профиль']) {
      expect(screen.getAllByLabelText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole('header', { name: 'Куда отправим?' })).toBeTruthy();
  });

  it('вкладки на казахском', async () => {
    await act(() => i18n.changeLanguage('kk'));
    await renderRouter(routes, { initialUrl: '/', wrapper });

    for (const label of ['Есептеу', 'Тапсырыстар', 'Бақылау', 'Хабарламалар', 'Профиль']) {
      expect(screen.getAllByLabelText(label).length).toBeGreaterThan(0);
    }
  });
});
