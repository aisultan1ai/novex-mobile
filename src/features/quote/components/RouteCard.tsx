import { ArrowUpDown } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CityPicker } from '@/features/cities/CityPicker';
import { useLocale } from '@/i18n/useLocale';
import { cityLabel } from '@/lib/cities';
import { cityCode } from '@/lib/cityCodes';
import { haptics } from '@/lib/haptics';
import { Text, fonts, motion, radii, shadows, sizes, spacing, useColors } from '@/ui';

export interface RouteCardProps {
  from: string;
  to: string;
  onChangeFrom: (city: string) => void;
  onChangeTo: (city: string) => void;
  onSwap: () => void;
  fromError?: string;
  toError?: string;
}

const ANDROID = Platform.OS === 'android';
const ROW = ANDROID ? 58 : 62;

/**
 * Маршрут (DESIGN-TZ 6.3): серый блок, две строки — код города, подпись, город.
 * Кнопка справа меняет города местами, иконка поворачивается на 180° за 250 мс.
 */
export function RouteCard(props: RouteCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [swapped, setSwapped] = useState(false);
  const angle = useSharedValue(0);

  useEffect(() => {
    const to = swapped ? 180 : 0;
    angle.set(
      reduceMotion
        ? to
        : withTiming(to, { duration: motion.slow, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
    );
  }, [swapped, reduceMotion, angle]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.get()}deg` }] }));

  return (
    <View>
      <View style={[styles.block, { backgroundColor: colors.subtle }]}>
        <RouteRow
          kind="from"
          label={t('quote.from')}
          placeholder={t('quote.fromPlaceholder')}
          city={props.from}
          error={props.fromError}
          onPress={() => setPicking('from')}
        />
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <RouteRow
          kind="to"
          label={t('quote.to')}
          placeholder={t('quote.toPlaceholder')}
          city={props.to}
          error={props.toError}
          onPress={() => setPicking('to')}
        />
        <Pressable
          onPress={() => {
            haptics.select();
            setSwapped((s) => !s);
            props.onSwap();
          }}
          accessibilityRole="button"
          accessibilityLabel={t('quote.swap')}
          style={[
            styles.swap,
            ANDROID ? styles.swapAndroid : styles.swapIos,
            { backgroundColor: colors.card, boxShadow: shadows.button },
          ]}
        >
          <Animated.View style={iconStyle}>
            <ArrowUpDown color={colors.text} size={20} strokeWidth={1.75} />
          </Animated.View>
        </Pressable>
      </View>
      {props.fromError || props.toError ? (
        <Text variant="caption" style={[styles.error, { color: colors.danger }]}>
          {props.fromError ?? props.toError}
        </Text>
      ) : null}
      <CityPicker
        visible={picking !== null}
        title={picking === 'to' ? t('quote.to') : t('quote.from')}
        onClose={() => setPicking(null)}
        onSelect={(city) => {
          if (picking === 'from') props.onChangeFrom(city);
          else props.onChangeTo(city);
          setPicking(null);
        }}
      />
    </View>
  );
}

function RouteRow({
  kind,
  label,
  placeholder,
  city,
  error,
  onPress,
}: {
  kind: 'from' | 'to';
  label: string;
  placeholder: string;
  city: string;
  error?: string;
  onPress: () => void;
}) {
  const colors = useColors();
  const locale = useLocale();
  const name = city ? cityLabel(city, locale) : '';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${name || placeholder}`}
      accessibilityHint={error}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      {ANDROID ? null : (
        <Text
          style={[styles.code, { color: kind === 'from' ? colors.textMuted : colors.text }]}
          importantForAccessibility="no"
        >
          {city ? cityCode(city) : '—'}
        </Text>
      )}
      <View style={styles.texts}>
        <Text variant="caption" style={{ color: error ? colors.danger : colors.textMuted }}>
          {label}
        </Text>
        <Text
          style={[styles.city, { color: name ? colors.text : colors.textSubtle }]}
          numberOfLines={1}
        >
          {name || placeholder}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: ANDROID ? 14 : radii.group },
  row: {
    height: ROW,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: spacing.md,
    paddingRight: 64,
  },
  code: { width: 30, fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 0.26 },
  texts: { flex: 1, gap: 1 },
  city: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  divider: { height: 1, marginLeft: ANDROID ? spacing.md : 60, marginRight: 64 },
  swap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  swapIos: {
    right: 12,
    top: ROW - sizes.hitTarget / 2,
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  swapAndroid: { right: 10, top: ROW - 24, width: 48, height: 48, borderRadius: 16 },
  error: { marginTop: spacing.xxs },
});
