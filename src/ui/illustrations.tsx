import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { Check } from 'lucide-react-native';

import { useColors } from './theme';

// Линейные иллюстрации (DESIGN-TZ 4, Illustration): линия цвета text 2–2.2 pt, заливки cyan / фон / subtle.
// Пути — из макетов docs/design-v2/screens. Все декоративные: скрыты от экранного диктора.

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants' as const,
};

/** Изометрическая коробка для карточек S/M/L (iOS-Home): w×h внутри холста 40×32, верх cyan у выбранной. */
export function IsoBox({ w, h, selected }: { w: number; h: number; selected: boolean }) {
  const colors = useColors();
  const x = (40 - w) / 2;
  const d = 6;
  const y = 31 - h;
  const top = `M${x} ${y + d} L${x + d} ${y} L${x + w} ${y} L${x + w - d} ${y + d} Z`;
  const body =
    `M${x} ${y + d} L${x + w - d} ${y + d} L${x + w - d} 31 L${x} 31 Z ` +
    `M${x + w - d} ${y + d} L${x + w} ${y} L${x + w} ${31 - d} L${x + w - d} 31`;
  return (
    <Svg width={40} height={32} viewBox="0 0 40 32" {...hidden}>
      <Path
        d={top}
        fill={selected ? colors.accent : colors.subtle}
        stroke={colors.text}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d={body}
        fill={colors.card}
        stroke={colors.text}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Открытая коробка с пунктиром к метке — пустой список заказов (iOS-Empty). */
export function OpenBoxIllustration() {
  const c = useColors();
  return (
    <Svg width={200} height={170} viewBox="0 0 200 170" fill="none" {...hidden}>
      <Path
        d="M100 70 L150 92 L100 114 L50 92 Z"
        fill={c.subtle}
        stroke={c.text}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Path
        d="M50 92 L50 136 L100 158 L100 114 Z"
        fill={c.card}
        stroke={c.text}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Path
        d="M150 92 L150 136 L100 158 L100 114 Z"
        fill={c.card}
        stroke={c.text}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Path
        d="M50 92 L36 74 L86 52 L100 70"
        fill={c.accent}
        stroke={c.text}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Path
        d="M150 92 L164 74 L114 52 L100 70"
        fill={c.accent}
        stroke={c.text}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Path
        d="M100 44 C 100 30, 112 22, 124 18"
        stroke={c.text}
        strokeWidth={2}
        strokeDasharray="3 5"
        strokeLinecap="round"
      />
      <Path
        d="M138 4 c-7 0 -12 5 -12 11 c0 8 12 18 12 18 s12 -10 12 -18 c0 -6 -5 -11 -12 -11 z"
        fill={c.card}
        stroke={c.text}
        strokeWidth={2.2}
      />
      <Circle cx={138} cy={15} r={4} fill={c.accent} />
      <Path d="M20 160 h20 M160 160 h20" stroke={c.text} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M40 30 v10 M35 35 h10" stroke={c.accent} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

/** Коробка и лупа с галочкой — экран «Отследить» (Android-Tracking). */
export function SearchParcelIllustration() {
  const c = useColors();
  return (
    <Svg width={150} height={120} viewBox="0 0 150 120" fill="none" {...hidden}>
      <Path
        d="M60 46 L96 62 L60 78 L24 62 Z"
        fill={c.accent}
        stroke={c.text}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M24 62 L24 94 L60 110 L60 78 Z"
        fill={c.card}
        stroke={c.text}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M96 62 L96 94 L60 110 L60 78 Z"
        fill={c.card}
        stroke={c.text}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={104} cy={40} r={22} fill={c.card} stroke={c.text} strokeWidth={2.2} />
      <Path d="M120 56 L136 72" stroke={c.text} strokeWidth={3} strokeLinecap="round" />
      <Path
        d="M96 40 l6 6 l10 -12"
        stroke={c.text}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 112 h16 M100 112 h30" stroke={c.text} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Коробка с кругом-галочкой — «Заказ оформлен» (iOS-Success). Галочка «выпрыгивает» один раз:
 * scale 0.4 → 1.1 → 1 за 500 мс (DESIGN-TZ 7).
 */
export function SuccessIllustration() {
  const c = useColors();
  const reduceMotion = useReducedMotion();
  const pop = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    pop.set(
      withDelay(
        200,
        withSequence(withTiming(1.1, { duration: 350 }), withTiming(1, { duration: 150 })),
      ),
    );
  }, [pop, reduceMotion]);

  const badge = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.get() / 0.4),
    transform: [{ scale: 0.4 + 0.6 * Math.min(pop.get(), 1.1) }],
  }));

  return (
    <View style={styles.success} {...hidden}>
      <Svg width={180} height={160} viewBox="0 0 180 160" fill="none">
        <Path
          d="M90 40 L146 64 L90 88 L34 64 Z"
          fill={c.accent}
          stroke={c.text}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
        <Path
          d="M34 64 L34 112 L90 136 L90 88 Z"
          fill={c.card}
          stroke={c.text}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
        <Path
          d="M146 64 L146 112 L90 136 L90 88 Z"
          fill={c.card}
          stroke={c.text}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
        <Path
          d="M62 52 L118 76 L118 90"
          stroke={c.text}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M44 118 l8 3.5 M44 108 l8 3.5"
          stroke={c.text}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d="M10 140 h26 M144 140 h26"
          stroke={c.text}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <Path d="M22 34 v10 M17 39 h10" stroke={c.accent} strokeWidth={2.2} strokeLinecap="round" />
        <Circle cx={160} cy={34} r={3.5} fill={c.accent} />
      </Svg>
      <Animated.View
        style={[styles.successBadge, { backgroundColor: c.card, borderColor: c.text }, badge]}
      >
        <Check color={c.text} size={18} strokeWidth={3} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  success: { width: 180, height: 160 },
  successBadge: {
    position: 'absolute',
    left: 128,
    top: 6,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
