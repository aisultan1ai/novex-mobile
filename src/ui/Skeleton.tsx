import { useEffect, type ReactNode } from 'react';
import { type DimensionValue, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from './theme';
import { motion, radii, spacing } from './tokens';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

/** Плашка-заглушка с мягкой пульсацией. При «уменьшить движение» — статичная. */
export function Skeleton({ width = '100%', height = 16, radius = radii.badge }: SkeletonProps) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.set(withRepeat(withTiming(0.5, { duration: 700 }), -1, true));
  }, [opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.subtle }, style]}
    />
  );
}

/** Группа скелетонов: появляется плавно, диктор слышит «Загрузка». */
export function SkeletonGroup({ children, label }: { children: ReactNode; label: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(motion.normal)}
      accessible
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      style={styles.group}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
});
