import type { LucideIcon } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { Text } from './Text';
import { useColors } from './theme';
import { radii, sizes, spacing } from './tokens';
import { usePressScale } from './usePressScale';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  /**
   * primary — cyan CTA с тёмным текстом; secondary — серая пилюля; ghost — только текст;
   * destructive — серая пилюля с красным текстом (DESIGN-TZ 4).
   */
  variant?: ButtonVariant;
  /** large — 56 pt (онбординг, «Заказ оформлен»). */
  size?: 'default' | 'large';
  icon?: LucideIcon;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = 'primary',
  size = 'default',
  icon: Icon,
  loading = false,
  disabled,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const colors = useColors();
  const press = usePressScale();
  const inactive = disabled || loading;

  const textColor =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'destructive'
        ? colors.danger
        : colors.text;
  const background = (pressed: boolean) =>
    variant === 'primary'
      ? pressed
        ? colors.primaryPressed
        : colors.primary
      : variant === 'ghost'
        ? 'transparent'
        : colors.subtle;

  return (
    <Animated.View style={[press.style, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: !!inactive, busy: loading }}
        disabled={inactive}
        onPressIn={(e) => {
          press.onPressIn();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          press.onPressOut();
          onPressOut?.(e);
        }}
        style={({ pressed }) => [
          styles.base,
          {
            minHeight:
              variant === 'ghost'
                ? sizes.hitTarget
                : size === 'large'
                  ? sizes.buttonHeightLarge
                  : sizes.buttonHeight,
            backgroundColor: background(pressed),
          },
          inactive && styles.inactive,
        ]}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <View style={styles.content}>
            {Icon ? <Icon color={textColor} size={20} strokeWidth={1.75} /> : null}
            <Text
              variant="bodyStrong"
              style={[styles.label, { color: textColor }]}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { textAlign: 'center', flexShrink: 1 },
  inactive: { opacity: 0.45 },
});
