import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { AccessibilityInfo } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SwipeToConfirm } from '@/ui/SwipeToConfirm';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => undefined),
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
}));

// В приложении корень оборачивает GestureHandlerRootView (app/_layout.tsx) — повторяем это в тесте.
const renderInRoot = (ui: ReactElement) =>
  render(<GestureHandlerRootView style={{ flex: 1 }}>{ui}</GestureHandlerRootView>);

describe('SwipeToConfirm', () => {
  afterEach(() => jest.restoreAllMocks());

  it('с экранным диктором — обычная кнопка с тем же действием', async () => {
    jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);
    const onConfirm = jest.fn();
    await renderInRoot(<SwipeToConfirm label="Свайпните для оформления" onConfirm={onConfirm} />);

    const button = await screen.findByRole('button', { name: 'Свайпните для оформления' });
    await waitFor(() => expect(button.props.accessibilityState?.disabled).toBeFalsy());
    await fireEvent.press(button);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('без диктора — ползунок; действие «activate» (Switch Control) подтверждает без свайпа', async () => {
    jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(false);
    const onConfirm = jest.fn();
    await renderInRoot(<SwipeToConfirm label="Свайпните для оформления" onConfirm={onConfirm} />);

    const track = await screen.findByLabelText('Свайпните для оформления');
    await fireEvent(track, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disabled — activate ничего не делает', async () => {
    jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(false);
    const onConfirm = jest.fn();
    await renderInRoot(<SwipeToConfirm label="Оформить" onConfirm={onConfirm} disabled />);

    const track = await screen.findByLabelText('Оформить');
    await fireEvent(track, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
