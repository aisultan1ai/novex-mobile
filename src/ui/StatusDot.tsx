import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { describeStatus, isKnownStatus } from '@/lib/orderStatus';

import { Text } from './Text';
import { useColors } from './theme';
import { fonts } from './tokens';

export interface StatusDotProps {
  /** Статус из API; неизвестный → «Обрабатывается». */
  status: string;
  /** Своя подпись вместо названия статуса. */
  label?: string;
  /** Дополнение серым после точки: « · сегодня». */
  meta?: string;
  size?: number;
}

/** Статус = цветная точка + текст, не только цвет (ТЗ 5.7, DESIGN-TZ 4). */
export function StatusDot({ status, label, meta, size = 8 }: StatusDotProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { group, tone } = describeStatus(status);
  const text =
    label ?? (isKnownStatus(status) ? t(`orderStatus.${status}`) : t(`statusGroup.${group}`));

  return (
    <View style={styles.row}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.status[tone],
        }}
      />
      <Text style={styles.label} numberOfLines={1}>
        {text}
        {meta ? <Text style={[styles.meta, { color: colors.textMuted }]}> · {meta}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, flexShrink: 1 },
  meta: { fontFamily: fonts.regular },
});
