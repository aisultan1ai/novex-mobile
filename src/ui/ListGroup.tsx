import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { useColors } from './theme';
import { fonts, radii, spacing } from './tokens';

/** Сгруппированный список в стиле iOS: фон subtle, радиус 18, строки 54 pt, тонкие разделители. */
export function ListGroup({ children }: { children: ReactNode }) {
  const colors = useColors();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[styles.group, { backgroundColor: colors.subtle }]}>
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          {index > 0 ? (
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          ) : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

export interface ListRowProps {
  title: string;
  icon?: LucideIcon;
  /** Значение справа (язык, счётчик). */
  value?: string;
  /** Свой элемент справа вместо значения и шеврона (Switch). */
  right?: ReactNode;
  onPress?: () => void;
  /** Красный текст («Выйти»). */
  destructive?: boolean;
  accessibilityHint?: string;
}

export function ListRow({
  title,
  icon: Icon,
  value,
  right,
  onPress,
  destructive = false,
  accessibilityHint,
}: ListRowProps) {
  const colors = useColors();
  const tint = destructive ? colors.danger : colors.text;
  const content = (
    <>
      {Icon ? <Icon color={tint} size={20} strokeWidth={1.6} /> : null}
      <Text style={[styles.title, { color: tint }]} numberOfLines={2}>
        {title}
      </Text>
      {right ?? (
        <>
          {value ? (
            <Text variant="label" tone="muted" numberOfLines={1} style={styles.value}>
              {value}
            </Text>
          ) : null}
          {onPress && !destructive ? (
            <ChevronRight color={colors.textSubtle} size={18} strokeWidth={2} />
          ) : null}
        </>
      )}
    </>
  );

  if (!onPress) {
    return (
      <View
        style={styles.row}
        accessible={!right}
        accessibilityLabel={[title, value].filter(Boolean).join(', ')}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, value].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: radii.group, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth * 2, marginLeft: spacing.md },
  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  title: { flex: 1, fontFamily: fonts.medium, fontSize: 15, lineHeight: 20 },
  value: { maxWidth: '45%' },
});
