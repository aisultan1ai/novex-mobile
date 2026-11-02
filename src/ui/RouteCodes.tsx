import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { useLocale } from '@/i18n/useLocale';
import { cityLabel } from '@/lib/cities';
import { cityCode } from '@/lib/cityCodes';

import { Text } from './Text';
import { useColors } from './theme';
import { fonts, typography, type TypographyVariant } from './tokens';

export interface RouteCodesProps {
  /** Города как в API (русское value). */
  from: string;
  to: string;
  /** sm 22 (билет), md 28 (тарифы), lg 36 (трекинг). */
  size?: 'sm' | 'md' | 'lg';
  /** Стрелка в конце пунктира (трекинг). */
  arrow?: boolean;
  /** Под кодами — названия городов и подписи (даты). */
  showCities?: boolean;
  fromCaption?: string;
  toCaption?: string;
  /** Приглушённый пунктир (карточка-билет). */
  mutedLine?: boolean;
}

const VARIANT: Record<NonNullable<RouteCodesProps['size']>, TypographyVariant> = {
  sm: 'codeSm',
  md: 'code',
  lg: 'codeLg',
};

/**
 * Маршрут кодами как в авиабилете: «ALA ┈┈→ NQZ» (DESIGN-TZ 4, 5). Коды декоративные:
 * диктор читает названия городов.
 */
export function RouteCodes({
  from,
  to,
  size = 'md',
  arrow = false,
  showCities = false,
  fromCaption,
  toCaption,
  mutedLine = false,
}: RouteCodesProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const locale = useLocale();
  const fromName = cityLabel(from, locale);
  const toName = cityLabel(to, locale);
  const lineColor = mutedLine ? colors.textSubtle : colors.text;
  const stroke = size === 'sm' ? 1.5 : 2;
  const gap = size === 'lg' ? 12 : size === 'md' ? 10 : 8;

  return (
    <View accessible accessibilityLabel={t('common.route', { from: fromName, to: toName })}>
      <View style={[styles.row, { gap }]}>
        <Text variant={VARIANT[size]}>{cityCode(from)}</Text>
        <View style={styles.line}>
          <Svg width="100%" height={10}>
            <Line
              x1={0}
              y1={5}
              x2="100%"
              y2={5}
              stroke={lineColor}
              strokeWidth={stroke}
              strokeDasharray={size === 'sm' ? '3 4' : '3 5'}
            />
          </Svg>
          {arrow ? (
            <Svg width={7} height={10} style={styles.arrow}>
              <Path d="M0 0 L7 5 L0 10 Z" fill={lineColor} />
            </Svg>
          ) : null}
        </View>
        <Text variant={VARIANT[size]}>{cityCode(to)}</Text>
      </View>
      {showCities ? (
        <View style={styles.cities}>
          <View style={styles.city}>
            <Text style={styles.cityName} numberOfLines={1}>
              {fromName}
            </Text>
            {fromCaption ? (
              <Text variant="label" tone="muted" numberOfLines={1}>
                {fromCaption}
              </Text>
            ) : null}
          </View>
          <View style={[styles.city, styles.cityRight]}>
            <Text style={[styles.cityName, styles.right]} numberOfLines={1}>
              {toName}
            </Text>
            {toCaption ? (
              <Text variant="label" tone="muted" numberOfLines={1} style={styles.right}>
                {toCaption}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  line: { flex: 1, height: 10, justifyContent: 'center' },
  arrow: { position: 'absolute', right: -2 },
  cities: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 12 },
  city: { flexShrink: 1 },
  cityRight: { alignItems: 'flex-end' },
  cityName: { ...typography.label, fontFamily: fonts.semibold },
  right: { textAlign: 'right' },
});
