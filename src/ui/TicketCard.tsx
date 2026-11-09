import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { CarrierLogo } from './CarrierLogo';
import { RouteCodes } from './RouteCodes';
import { StatusDot } from './StatusDot';
import { Text } from './Text';
import { useColors } from './theme';
import { fonts, radii, shadows, spacing } from './tokens';

const STUB = 92;
const NOTCH_W = 18;
const NOTCH_H = 9;

export interface TicketCardProps {
  from: string;
  to: string;
  /** Подпись под кодами: «Алматы → Астана». */
  citiesLabel: string;
  status: string;
  /** Своя подпись статуса и дата после точки. */
  statusLabel?: string;
  date?: string;
  carrierCode: string;
  carrierName: string;
  price: string;
  onPress: (event: GestureResponderEvent) => void;
  accessibilityLabel: string;
}

/**
 * Заказ «билетом» (DESIGN-TZ 4): слева коды маршрута, города и статус; вертикальный пунктир;
 * справа корешок 92 pt с логотипом и ценой; полукруглые вырезы на линии пунктира.
 */
export function TicketCard({
  from,
  to,
  citiesLabel,
  status,
  statusLabel,
  date,
  carrierCode,
  carrierName,
  price,
  onPress,
  accessibilityLabel,
}: TicketCardProps) {
  const colors = useColors();
  const notch = { backgroundColor: colors.background, borderColor: colors.line };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.line, boxShadow: shadows.ticket },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.main} importantForAccessibility="no-hide-descendants">
        <RouteCodes from={from} to={to} size="sm" mutedLine />
        <Text variant="caption" tone="muted" numberOfLines={1} style={styles.cities}>
          {citiesLabel}
        </Text>
        <View style={styles.status}>
          <StatusDot status={status} label={statusLabel} meta={date} />
        </View>
      </View>

      <View style={styles.divider}>
        <Svg width={2} height="100%">
          <Line
            x1={1}
            y1={0}
            x2={1}
            y2="100%"
            stroke={colors.lineStrong}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        </Svg>
      </View>

      <View style={styles.stub} importantForAccessibility="no-hide-descendants">
        <CarrierLogo code={carrierCode} name={carrierName} size={52} bare />
        <Text style={[styles.price, { color: colors.strong }]} numberOfLines={1}>
          {price}
        </Text>
      </View>

      <View style={[styles.notch, styles.notchTop, notch]} />
      <View style={[styles.notch, styles.notchBottom, notch]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    minHeight: 124,
    borderWidth: 1,
    borderRadius: radii.card,
  },
  pressed: { opacity: 0.9 },
  main: {
    flex: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingLeft: 18,
    paddingRight: 14,
  },
  cities: { marginTop: 3 },
  status: { marginTop: spacing.sm },
  divider: { width: 2, marginVertical: spacing.md },
  stub: { width: STUB, alignItems: 'center', justifyContent: 'center', gap: 10 },
  price: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  notch: {
    position: 'absolute',
    right: STUB - NOTCH_W / 2 + 1,
    width: NOTCH_W,
    height: NOTCH_H,
    borderWidth: 1,
  },
  notchTop: {
    top: -1,
    borderTopWidth: 0,
    borderBottomLeftRadius: NOTCH_H,
    borderBottomRightRadius: NOTCH_H,
  },
  notchBottom: {
    bottom: -1,
    borderBottomWidth: 0,
    borderTopLeftRadius: NOTCH_H,
    borderTopRightRadius: NOTCH_H,
  },
});
