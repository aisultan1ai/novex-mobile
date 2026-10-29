import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from './theme';
import { radii, shadows, spacing } from './tokens';

export interface CardProps {
  children: ReactNode;
  /** Выбранная карточка: рамка cyan + мягкое свечение (ТЗ 6.1). */
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  selected = false,
  onPress,
  accessibilityLabel,
  style,
}: CardProps) {
  const colors = useColors();
  const base = [
    styles.card,
    { backgroundColor: colors.card, borderColor: selected ? colors.accent : colors.line },
    selected && { borderWidth: 2, boxShadow: `0 0 0 4px ${colors.accentGlow}` },
    style,
  ];

  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.card,
  },
  pressed: { transform: [{ scale: 0.99 }] },
});
