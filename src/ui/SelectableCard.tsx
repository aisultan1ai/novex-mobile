import { Check } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from './theme';
import { motion, radii, spacing } from './tokens';

const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

export interface SelectableCardProps {
  children: ReactNode;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  /** Скругление: тарифы 20, размеры S/M/L 18, способы оплаты 16. */
  radius?: number;
  /** Размер круга-галочки: 20–22 pt. */
  checkSize?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Карточка выбора (тарифы, размеры, способы оплаты): обычная — рамка line 1 pt; выбранная — рамка cyan
 * 1.5 pt и круг-галочка в правом верхнем углу, появляется scale 0.6→1 за 200 мс (DESIGN-TZ 4, 7).
 */
export function SelectableCard({
  children,
  selected,
  onPress,
  accessibilityLabel,
  disabled = false,
  radius = radii.card,
  checkSize = 22,
  style,
}: SelectableCardProps) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderRadius: radius,
          backgroundColor: colors.card,
          borderColor: selected ? colors.accent : colors.line,
          borderWidth: selected ? 1.5 : 1,
          // Компенсируем толщину рамки, чтобы содержимое не прыгало при выборе.
          margin: selected ? 0 : 0.5,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children}
      <SelectedCheck visible={selected} size={checkSize} />
    </Pressable>
  );
}

export function SelectedCheck({ visible, size = 22 }: { visible: boolean; size?: number }) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    const to = visible ? 1 : 0;
    progress.set(reduceMotion ? to : withTiming(to, { duration: motion.normal, easing: EASE }));
  }, [visible, reduceMotion, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: 0.6 + 0.4 * progress.get() }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.check,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accent },
        style,
      ]}
    >
      <View>
        <Check color={colors.onPrimary} size={size * 0.55} strokeWidth={3.5} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  check: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
