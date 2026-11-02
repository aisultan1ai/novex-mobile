import { useEffect } from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { radii, useColors } from '@/ui';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DURATION = 450;

/**
 * «Билет → трекинг» (DESIGN-TZ 6.10, 7): оверлей растёт от рамки карточки до всего экрана за 450 мс,
 * сверху — цвет схемы трекинга. По окончании вызывается onDone (открыть экран трекинга).
 * Shared-element переходы expo-router не используем: в SDK 58 они нестабильны.
 */
export function TicketExpand({ from, onDone }: { from: Rect | null; onDone: () => void }) {
  const colors = useColors();
  const window = useWindowDimensions();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!from) return;
    progress.set(0);
    progress.set(
      withTiming(1, { duration: DURATION, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }, (finished) => {
        if (finished) scheduleOnRN(onDone);
      }),
    );
  }, [from, onDone, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    const r = from ?? { x: 0, y: 0, width: window.width, height: window.height };
    return {
      left: r.x * (1 - p),
      top: r.y * (1 - p),
      width: r.width + (window.width - r.width) * p,
      height: r.height + (window.height - r.height) * p,
      borderRadius: radii.card * (1 - p),
    };
  });

  return (
    <Modal visible={!!from} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.box, { backgroundColor: colors.background }, style]}>
        <View style={[styles.map, { backgroundColor: colors.mapBackground }]} />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', overflow: 'hidden' },
  map: { height: '45%' },
});
