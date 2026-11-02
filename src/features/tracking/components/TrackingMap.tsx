import { Home, Truck } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { GlassSurface, Text, fonts, lightColors, shadows, useColors } from '@/ui';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const MAP_HEIGHT = 500;
const W = 393;
const ROUTE_LEN = 420;

// Цвета схемы — поверх тёмного mapBackground в обеих темах.
const ROAD = 'rgba(255,255,255,0.09)';
const ROAD_THIN = 'rgba(255,255,255,0.05)';
const RIVER = 'rgba(34,201,224,0.16)';
const LABEL = 'rgba(255,255,255,0.38)';
const WHITE = lightColors.onNavy;

export interface TrackingMapProps {
  /** city — курьер в городе получателя; intercity — посылка между городами. */
  mode: 'city' | 'intercity';
  fromLabel: string;
  toLabel: string;
  /** Плашка на схеме: «Курьер едет к получателю». */
  badge?: string;
}

/**
 * Статичная векторная схема (DESIGN-TZ 6.8): координат и ETA курьера в API нет, поэтому не карта.
 * Маршрут белой линией «прорисовывается» один раз при открытии (1000 мс).
 */
export function TrackingMap({ mode, fromLabel, toLabel, badge }: TrackingMapProps) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const draw = useSharedValue(reduceMotion ? 0 : ROUTE_LEN);

  useEffect(() => {
    if (reduceMotion) return;
    draw.set(
      withDelay(200, withTiming(0, { duration: 1000, easing: Easing.bezier(0.4, 0, 0.2, 1) })),
    );
  }, [draw, reduceMotion]);

  const routeProps = useAnimatedProps(() => ({ strokeDashoffset: draw.get() }));

  const route =
    mode === 'city'
      ? 'M118 376 L200 366 L288 356 L292 300 L298 250 L304 196'
      : 'M70 380 C 140 360, 150 280, 200 250 S 280 190, 310 150';
  const start = mode === 'city' ? { x: 118, y: 376 } : { x: 70, y: 380 };
  const end = mode === 'city' ? { x: 304, y: 196 } : { x: 310, y: 150 };

  return (
    <View
      style={[styles.map, { backgroundColor: colors.mapBackground }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg
        width="100%"
        height={MAP_HEIGHT}
        viewBox={`0 0 ${W} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <Path
          d="M-20 250 C 80 230, 120 280, 220 250 S 360 200, 420 215"
          stroke={RIVER}
          strokeWidth={22}
          strokeLinecap="round"
          fill="none"
        />
        <Path d="M24 60 L120 48 L132 140 L36 152 Z" fill="rgba(18,184,134,0.10)" />
        <Path d="M-20 120 L420 64" stroke={ROAD} strokeWidth={14} />
        <Path d="M-20 380 L420 330" stroke={ROAD} strokeWidth={12} />
        <Path d="M70 -20 L150 520" stroke={ROAD} strokeWidth={14} />
        <Path d="M310 -20 L268 520" stroke={ROAD} strokeWidth={12} />
        <Path
          d="M-20 190 L420 140 M-20 450 L420 410 M200 -20 L196 520 M24 -20 L60 520 M362 -20 L340 520"
          stroke={ROAD_THIN}
          strokeWidth={6}
        />
        <Path
          d={route}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <AnimatedPath
          d={route}
          stroke={WHITE}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={ROUTE_LEN}
          animatedProps={routeProps}
        />
        {mode === 'intercity' ? (
          <>
            <Circle cx={start.x} cy={start.y} r={7} fill={WHITE} />
            <SvgText
              x={start.x + 14}
              y={start.y + 4}
              fill={LABEL}
              fontSize={12}
              fontFamily={fonts.semibold}
            >
              {fromLabel}
            </SvgText>
            <SvgText
              x={end.x - 14}
              y={end.y - 24}
              fill={LABEL}
              fontSize={12}
              fontFamily={fonts.semibold}
              textAnchor="end"
            >
              {toLabel}
            </SvgText>
          </>
        ) : null}
      </Svg>

      {mode === 'city' ? (
        <View style={[styles.marker, styles.truck, { left: start.x - 19, top: start.y - 19 }]}>
          <Truck color={lightColors.navy} size={20} strokeWidth={2} />
        </View>
      ) : null}
      <View
        style={[
          styles.marker,
          styles.home,
          { left: end.x - 18, top: end.y - 18, backgroundColor: colors.accent },
        ]}
      >
        <Home color={lightColors.text} size={16} strokeWidth={2.2} />
      </View>

      {badge ? (
        <GlassSurface variant="onDark" style={[styles.badge, { left: 46, top: 300 }]}>
          <Text style={styles.badgeText} numberOfLines={2}>
            {badge}
          </Text>
        </GlassSurface>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: MAP_HEIGHT, overflow: 'hidden' },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.marker,
  },
  truck: { width: 38, height: 38, borderRadius: 19, backgroundColor: WHITE },
  home: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: WHITE },
  badge: {
    position: 'absolute',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
    maxWidth: 200,
  },
  badgeText: { color: WHITE, fontFamily: fonts.bold, fontSize: 14, lineHeight: 18 },
});
