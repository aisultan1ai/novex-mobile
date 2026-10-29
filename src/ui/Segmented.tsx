import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';

import { Text } from './Text';
import { useColors } from './theme';
import { radii, shadows, sizes, spacing } from './tokens';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.root, { backgroundColor: colors.subtle }]}
    >
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        const color = active ? colors.text : colors.textMuted;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (active) return;
              haptics.select();
              onChange(option.value);
            }}
            style={[styles.item, active && [styles.active, { backgroundColor: colors.card }]]}
          >
            {Icon ? <Icon color={color} size={18} strokeWidth={1.75} /> : null}
            <Text variant="label" style={{ color }} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', borderRadius: radii.button, padding: spacing.xxs },
  item: {
    flex: 1,
    minHeight: sizes.hitTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.button - spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  active: { boxShadow: shadows.raised },
});
