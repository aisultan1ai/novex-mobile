import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { useColors } from './theme';
import { fonts, radii, spacing } from './tokens';

export interface StatTileProps {
  label: string;
  value: string;
  /** navy — денежные и ключевые значения («К оплате по акту», «Осталось»). */
  tone?: 'default' | 'navy';
  /** large — 20 pt (профиль); default — 13–17 pt (трекинг). */
  size?: 'default' | 'large';
  align?: 'center' | 'left';
  /** Нажатие (например, копировать трек-номер). */
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/** Плитка с рамкой line, радиус 16: подпись 12 + значение (DESIGN-TZ 4). */
export function StatTile({
  label,
  value,
  tone = 'default',
  size = 'default',
  align = 'center',
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: StatTileProps) {
  const colors = useColors();
  const valueStyle = {
    color: tone === 'navy' ? colors.navy : colors.text,
    fontSize: size === 'large' ? 20 : value.length > 12 ? 13 : 17,
    textAlign: align,
  } as const;

  const body = (
    <>
      <Text variant="caption" tone="muted" style={{ textAlign: align }}>
        {label}
      </Text>
      <Text style={[styles.value, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    </>
  );

  const frame = [
    styles.tile,
    { borderColor: colors.line, borderRadius: size === 'large' ? radii.group : radii.tile },
  ];

  if (!onPress) {
    return (
      <View
        style={frame}
        accessible
        accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
      >
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [frame, pressed && { backgroundColor: colors.subtle }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.sm,
    minHeight: 72,
    justifyContent: 'center',
  },
  value: { fontFamily: fonts.bold, marginTop: 6, letterSpacing: -0.3 },
});
