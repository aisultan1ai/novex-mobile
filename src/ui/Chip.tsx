import { Check, type LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { Text } from './Text';
import { useColors } from './theme';
import { fonts, radii, sizes, spacing } from './tokens';

export interface ChipProps {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  selected?: boolean;
  /**
   * filter — фон subtle (фильтры заказов, «Прочитать все»);
   * outline — белая с рамкой (тип отправления, сортировка). Выбранная — navy с белым текстом.
   */
  variant?: 'filter' | 'outline';
  /** Растянуть на всю ширину ячейки сетки. */
  stretch?: boolean;
  /** Высота пилюли: 38–46 pt. */
  height?: number;
  accessibilityHint?: string;
}

/**
 * Чип-пилюля. На Android — M3 filter chip: радиус 8, высота 36, выбранный — тинт cyan с галочкой
 * (DESIGN-TZ 4, 8). Область нажатия добирается hitSlop до 48.
 */
export function Chip({
  label,
  onPress,
  icon: Icon,
  selected = false,
  variant = 'filter',
  stretch = false,
  height = 40,
  accessibilityHint,
}: ChipProps) {
  const colors = useColors();
  const android = Platform.OS === 'android';

  const bg = selected
    ? android
      ? colors.accentTintStrong
      : colors.navy
    : variant === 'outline'
      ? colors.card
      : colors.subtle;
  const fg = selected && !android ? colors.onNavy : colors.text;
  const border =
    selected && !android ? colors.navy : variant === 'outline' ? colors.line : 'transparent';
  const chipHeight = android ? 36 : height;
  const ShownIcon = selected && android ? Check : Icon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      hitSlop={Math.max(0, (sizes.hitTarget - chipHeight) / 2)}
      style={({ pressed }) => [
        styles.chip,
        {
          height: chipHeight,
          borderRadius: android ? radii.badge : radii.pill,
          backgroundColor: bg,
          borderColor: border,
        },
        stretch && styles.stretch,
        pressed && styles.pressed,
      ]}
    >
      {ShownIcon ? <ShownIcon color={fg} size={18} strokeWidth={1.75} /> : null}
      <Text variant="label" numberOfLines={1} style={[styles.label, { color: fg }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  stretch: { flex: 1, paddingHorizontal: spacing.xs },
  label: { fontFamily: fonts.semibold, fontSize: 14, flexShrink: 1 },
  pressed: { opacity: 0.75 },
});
