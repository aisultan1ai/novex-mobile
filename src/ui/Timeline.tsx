import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { Text } from './Text';
import { useColors } from './theme';
import { fonts, spacing } from './tokens';

export interface TimelineItem {
  key: string;
  title: string;
  meta?: string;
  /** Текущий шаг: кружок cyan с тёмной точкой, заголовок жирнее. */
  current?: boolean;
}

/**
 * Вертикальный таймлайн (DESIGN-TZ 4): кружки 22 pt — текущий cyan, прошлые белые с рамкой ink 1.5,
 * между ними пунктир; заголовок 15, мета 13.
 */
export function Timeline({
  items,
  accessibilityLabel,
}: {
  items: TimelineItem[];
  accessibilityLabel?: string;
}) {
  const colors = useColors();
  const lineColor = colors.dashed;

  return (
    <View accessibilityRole="list" accessibilityLabel={accessibilityLabel}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <View
            key={item.key}
            style={styles.item}
            accessible
            accessibilityLabel={[item.title, item.meta].filter(Boolean).join(', ')}
          >
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  item.current
                    ? { backgroundColor: colors.accent }
                    : {
                        backgroundColor: colors.background,
                        borderWidth: 1.5,
                        borderColor: colors.text,
                      },
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: item.current ? colors.onPrimary : colors.text },
                  ]}
                />
              </View>
              {last ? null : (
                <View style={styles.lineBox}>
                  <Svg width={2} height="100%">
                    <Line
                      x1={1}
                      y1={0}
                      x2={1}
                      y2="100%"
                      stroke={lineColor}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />
                  </Svg>
                </View>
              )}
            </View>
            <View style={[styles.body, last && styles.bodyLast]}>
              <Text
                style={[styles.title, { fontFamily: item.current ? fonts.bold : fonts.medium }]}
              >
                {item.title}
              </Text>
              {item.meta ? (
                <Text variant="label" tone="muted" style={styles.meta}>
                  {item.meta}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 14 },
  rail: { width: 22, alignItems: 'center' },
  node: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  lineBox: { flex: 1, width: 2, marginVertical: spacing.xxs },
  body: { flex: 1, paddingBottom: 18 },
  bodyLast: { paddingBottom: 0 },
  title: { fontSize: 15, lineHeight: 20 },
  meta: { marginTop: 3 },
});
