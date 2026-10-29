import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { Text } from './Text';
import { useColors } from './theme';
import { fonts, logoColors, spacing } from './tokens';

// Геометрия — из assets/brand/novex-mark.svg, обрезанная по габаритам знака (x 109.5…417.5, y 115.5…396.5).
const VIEWBOX = '109.5 115.5 308 281';
const RATIO = 308 / 281;

export interface LogoProps {
  /** Высота знака в pt. */
  size?: number;
  /** Подпись «novex» справа от знака: строчными, Space Grotesk 700 (ТЗ 6.1). */
  wordmark?: boolean;
  /** Подпись для экранного диктора; без неё логотип считается декоративным. */
  accessibilityLabel?: string;
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size * RATIO} height={size} viewBox={VIEWBOX}>
      <Circle cx={155} cy={256} r={45.5} fill={logoColors.node} />
      <Line x1={155} y1={256} x2={375} y2={256} stroke={logoColors.node} strokeWidth={22} />
      <Circle cx={375} cy={256} r={42.5} fill={logoColors.node} />
      <Line
        x1={183.5}
        y1={233}
        x2={365}
        y2={142.25}
        stroke={logoColors.branch}
        strokeWidth={20}
        strokeLinecap="round"
      />
      <Line
        x1={183.5}
        y1={279}
        x2={365}
        y2={369.75}
        stroke={logoColors.branch}
        strokeWidth={20}
        strokeLinecap="round"
      />
      <Circle cx={365} cy={146.5} r={31} fill={logoColors.branch} />
      <Circle cx={365} cy={365.5} r={31} fill={logoColors.branch} />
    </Svg>
  );
}

export function Logo({ size = 32, wordmark = false, accessibilityLabel }: LogoProps) {
  const colors = useColors();
  return (
    <View
      style={styles.row}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    >
      <LogoMark size={size} />
      {wordmark ? (
        <Text
          style={[
            styles.wordmark,
            { color: colors.primary, fontSize: size * 0.9, lineHeight: size * 1.1 },
          ]}
        >
          novex
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  wordmark: { fontFamily: fonts.display, letterSpacing: 0.3 },
});
