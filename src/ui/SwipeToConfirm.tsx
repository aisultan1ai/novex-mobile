import { ChevronsRight, Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '@/lib/haptics';

import { Button } from './Button';
import { Text } from './Text';
import { useColors } from './theme';
import { motion, radii, sizes, spacing } from './tokens';

export interface SwipeToConfirmProps {
  /** «Свайпните для оформления». Для экранного диктора это же — подпись кнопки. */
  label: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  /** Идёт запрос после подтверждения: ползунок остаётся справа со спиннером. */
  loading?: boolean;
}

const KNOB = sizes.buttonHeight - spacing.xxs * 2;
/** Доля ширины, после которой отпускание = подтверждение. */
const THRESHOLD = 0.85;

/**
 * Ползунок подтверждения вместо кнопки на последнем шаге оформления (защита от случайного нажатия).
 * С экранным диктором свайп недоступен — тогда рисуется обычная кнопка с тем же действием.
 */
export function SwipeToConfirm(props: SwipeToConfirmProps) {
  const screenReader = useScreenReaderEnabled();
  if (screenReader) {
    return (
      <Button
        title={props.label}
        onPress={() => void props.onConfirm()}
        disabled={props.disabled}
        loading={props.loading}
      />
    );
  }
  return <SwipeTrack {...props} />;
}

function SwipeTrack({ label, onConfirm, disabled = false, loading = false }: SwipeToConfirmProps) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [prevLoading, setPrevLoading] = useState(loading);

  const maxX = Math.max(trackWidth - KNOB - spacing.xxs * 2, 0);
  // Shared values меняем через get()/set() — так их понимает React Compiler (Reanimated 4).
  const x = useSharedValue(0);
  const armed = useSharedValue(false);
  const duration = reduceMotion ? 0 : motion.normal;

  // Запрос закончился ошибкой (loading снова false) — снимаем «галочку» прямо при рендере.
  if (prevLoading !== loading) {
    setPrevLoading(loading);
    if (!loading) setConfirmed(false);
  }

  // …и возвращаем ползунок в начало.
  useEffect(() => {
    if (!loading) x.set(withTiming(0, { duration }));
  }, [loading, duration, x]);

  const confirm = () => {
    setConfirmed(true);
    haptics.success();
    void onConfirm();
  };

  const pan = usePanGesture({
    enabled: !disabled && !loading && maxX > 0,
    activeOffsetX: [-8, 8],
    failOffsetY: [-12, 12],
    onUpdate: (e) => {
      'worklet';
      const next = Math.min(Math.max(e.translationX, 0), maxX);
      x.set(next);
      const pastThreshold = next >= maxX * THRESHOLD;
      // Щелчок при пересечении порога в любую сторону — палец «чувствует» точку подтверждения.
      if (pastThreshold !== armed.get()) {
        armed.set(pastThreshold);
        scheduleOnRN(haptics.tick);
      }
    },
    onDeactivate: (e) => {
      'worklet';
      if (!e.canceled && x.get() >= maxX * THRESHOLD) {
        x.set(withTiming(maxX, { duration }));
        scheduleOnRN(confirm);
      } else {
        x.set(withTiming(0, { duration }));
      }
      armed.set(false);
    },
  });

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: x.get() + KNOB }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [0, maxX * 0.6], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: loading }}
      // Голосовое управление / Switch Control: действие «активировать» подтверждает без свайпа.
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'activate' && !disabled && !loading) confirm();
      }}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={[
        styles.track,
        { backgroundColor: colors.subtle, borderColor: colors.line },
        disabled && styles.disabled,
      ]}
    >
      {/* Заливка — navy, не cyan: cyan большими площадями не используем (ТЗ 6.1). */}
      <Animated.View style={[styles.fill, { backgroundColor: colors.primary }, fillStyle]} />
      <Animated.View style={[styles.labelWrap, labelStyle]} pointerEvents="none">
        <Text variant="bodyStrong" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {label}
        </Text>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.knob, { backgroundColor: colors.card }, knobStyle]}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : confirmed ? (
            <Check color={colors.primary} size={24} strokeWidth={2} />
          ) : (
            <ChevronsRight color={colors.primary} size={24} strokeWidth={2} />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function useScreenReaderEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((value) => {
      if (mounted) setEnabled(value);
    });
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return enabled;
}

const styles = StyleSheet.create({
  track: {
    height: sizes.buttonHeight,
    borderRadius: radii.button,
    borderWidth: 1,
    padding: spacing.xxs,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  disabled: { opacity: 0.5 },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radii.button,
  },
  labelWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: KNOB + spacing.sm,
    paddingRight: spacing.md,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: radii.button - spacing.xxs / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
