import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { motion } from './tokens';

/** Нажатие: scale 0.98 за 120 мс (DESIGN-TZ 7). При «уменьшить движение» — без анимации. */
export function usePressScale(pressedScale = 0.98) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const to = (value: number) => {
    if (reduceMotion) return;
    scale.set(withTiming(value, { duration: motion.press }));
  };
  return {
    style,
    onPressIn: () => to(pressedScale),
    onPressOut: () => to(1),
  };
}
