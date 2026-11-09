import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type EntryExitAnimationFunction,
} from 'react-native-reanimated';

import { Button, type ButtonProps } from './Button';
import { GlassSurface } from './glass/GlassSurface';
import { Text } from './Text';
import { useColors } from './theme';
import { motion, screenPadding, spacing, typography } from './tokens';

const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

export interface BottomBarProps {
  /** «Итого». */
  totalLabel: string;
  /** Отформатированная цена; при смене — анимация (уходит вверх, новая въезжает снизу). */
  total?: string;
  /** Под итогом: «было 4 890 ₸». */
  note?: ReactNode;
  /** Шаг оформления: 0.25 / 0.5 / 0.75. Без значения линии прогресса нет. */
  progress?: number;
  /** С какого значения анимировать линию при входе на экран (предыдущий шаг). */
  progressFrom?: number;
  cta: Pick<ButtonProps, 'title' | 'onPress' | 'loading' | 'disabled'>;
}

/**
 * Липкая нижняя панель (DESIGN-TZ 4): стекло, линия прогресса шага, «Итого» + цена navy 22, CTA справа.
 * Контент экрана прокручивается под ней (Screen footer + useScreenInsets).
 */
export function BottomBar({
  totalLabel,
  total,
  note,
  progress,
  progressFrom,
  cta,
}: BottomBarProps) {
  const colors = useColors();
  return (
    <GlassSurface style={styles.bar}>
      {progress !== undefined ? (
        <ProgressLine value={progress} from={progressFrom ?? progress} />
      ) : null}
      <View style={styles.row}>
        <View
          style={styles.total}
          accessible
          accessibilityLabel={[totalLabel, total].filter(Boolean).join(' ')}
        >
          <View style={styles.totalLine}>
            <Text variant="label" tone="muted">
              {totalLabel}
            </Text>
            {total ? <AnimatedPrice value={total} color={colors.strong} /> : null}
          </View>
          {note ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {note}
            </Text>
          ) : null}
        </View>
        <Button {...cta} style={styles.cta} />
      </View>
    </GlassSurface>
  );
}

function ProgressLine({ value, from }: { value: number; from: number }) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const width = useSharedValue(reduceMotion ? value : from);

  useEffect(() => {
    width.set(
      reduceMotion ? value : withTiming(value, { duration: motion.progress, easing: EASE }),
    );
  }, [value, reduceMotion, width]);

  const fill = useAnimatedStyle(() => ({ width: `${width.get() * 100}%` }));
  return (
    <View
      accessible
      style={[styles.track, { backgroundColor: colors.line }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: colors.strong }, fill]} />
    </View>
  );
}

const PRICE_SHIFT = 6;

const priceIn: EntryExitAnimationFunction = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: PRICE_SHIFT }] },
    animations: {
      opacity: withTiming(1, { duration: motion.normal, easing: EASE }),
      transform: [{ translateY: withTiming(0, { duration: motion.normal, easing: EASE }) }],
    },
  };
};

const priceOut: EntryExitAnimationFunction = () => {
  'worklet';
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
    animations: {
      opacity: withTiming(0, { duration: motion.normal, easing: EASE }),
      transform: [
        { translateY: withTiming(-PRICE_SHIFT, { duration: motion.normal, easing: EASE }) },
      ],
    },
  };
};

/** Цена: старое значение уходит вверх с затуханием, новое въезжает снизу на 6 pt (DESIGN-TZ 7). */
export function AnimatedPrice({ value, color }: { value: string; color: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <View style={styles.priceBox}>
      <Animated.Text
        key={value}
        entering={reduceMotion ? undefined : priceIn}
        exiting={reduceMotion ? undefined : priceOut}
        style={[typography.priceLarge, { color }]}
        numberOfLines={1}
      >
        {value}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: 0, borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  track: { height: 2 },
  fill: { height: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  total: { flex: 1 },
  totalLine: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  priceBox: { overflow: 'visible' },
  cta: { flexShrink: 0, maxWidth: '58%' },
});
