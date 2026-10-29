import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from './Text';
import { useColors } from './theme';
import { radii, sizes, spacing } from './tokens';

export interface ChipProps {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  selected?: boolean;
  accessibilityHint?: string;
}

export function Chip({
  label,
  onPress,
  icon: Icon,
  selected = false,
  accessibilityHint,
}: ChipProps) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      hitSlop={spacing.xxs}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.card : colors.subtle,
          borderColor: selected ? colors.accent : 'transparent',
        },
        pressed && styles.pressed,
      ]}
    >
      {Icon ? <Icon color={colors.icon} size={16} strokeWidth={1.75} /> : null}
      <Text variant="label">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: sizes.hitTarget - spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  pressed: { opacity: 0.7 },
});
