import '@/i18n';
import { act } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { fireEvent } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import OnboardingRoute from '../app/onboarding';
import i18n from '@/i18n';
import { useSettingsStore } from '@/store/settings';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => undefined),
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
}));

// В приложении корень оборачивает GestureHandlerRootView (app/_layout.tsx).
const wrapper = ({ children }: { children: ReactNode }) => (
  <GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>
);

const routes = {
  onboarding: OnboardingRoute,
  index: () => null,
};

describe('онбординг', () => {
  beforeEach(async () => {
    useSettingsStore.setState({ onboardingSeen: false });
    await act(() => i18n.changeLanguage('ru'));
  });

  it('три слайда: «Далее» листает, «Начать» отмечает онбординг показанным', async () => {
    await renderRouter(routes, { initialUrl: '/onboarding', wrapper });
    expect(screen.getByRole('header', { name: /Все курьеры/ })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Далее' }));
    expect(screen.getByRole('header', { name: /Курьер заберёт/ })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Далее' }));
    expect(screen.getByRole('header', { name: /Каждая посылка/ })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Начать' }));
    expect(useSettingsStore.getState().onboardingSeen).toBe(true);
  });

  it('«Пропустить» сразу завершает; язык переключается', async () => {
    await renderRouter(routes, { initialUrl: '/onboarding', wrapper });
    await fireEvent.press(screen.getByRole('radio', { name: 'Қазақша' }));
    expect(useSettingsStore.getState().locale).toBe('kk');

    await fireEvent.press(screen.getByRole('button', { name: 'Пропустить' }));
    expect(useSettingsStore.getState().onboardingSeen).toBe(true);
  });
});
