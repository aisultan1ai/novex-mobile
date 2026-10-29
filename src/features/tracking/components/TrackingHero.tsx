import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { useLocale } from '@/i18n/useLocale';
import { cityLabel } from '@/lib/cities';
import { formatDate, formatTime } from '@/lib/format';
import { isKnownStatus } from '@/lib/orderStatus';
import { Text, motion, spacing, useColors } from '@/ui';
import { STATUS_ICONS, toneColor } from '@/ui/statusIcons';

import type { ShipmentLiveState } from '../liveState';

/** Огромный статус + маршрут + окно доставки. Главное, что попадёт на скриншот. */
export function TrackingHero({ state }: { state: ShipmentLiveState }) {
  const { t } = useTranslation();
  const colors = useColors();
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const Icon = STATUS_ICONS[state.group];
  const color = toneColor(colors, state.tone);
  const groupLabel = t(`statusGroup.${state.group}`);
  const detail = isKnownStatus(state.status) ? t(`orderStatus.${state.status}`) : null;

  const eta = state.deliveredAt
    ? t('tracking.deliveredAt', {
        date: formatDate(state.deliveredAt, locale),
        time: formatTime(state.deliveredAt),
      })
    : state.etaFrom && state.etaTo
      ? formatRange(state.etaFrom, state.etaTo, locale)
      : null;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(motion.slow)}
      style={styles.root}
    >
      <View style={styles.statusRow} accessible accessibilityRole="header">
        <View style={[styles.dot, { backgroundColor: color }]}>
          <Icon color={colors.card} size={18} strokeWidth={2} />
        </View>
        <Text variant="label" tone="muted">
          {t('tracking.statusNow')}
        </Text>
      </View>
      {/* Казахские статусы длиннее: шрифт уменьшается, а не обрезается и не рвёт слово. */}
      <Text
        variant="hero"
        style={styles.status}
        accessibilityRole="header"
        numberOfLines={3}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {groupLabel}
      </Text>
      {detail && detail !== groupLabel ? (
        <Text variant="heading" tone="muted">
          {detail}
        </Text>
      ) : null}

      <View style={styles.route}>
        <Text variant="title" numberOfLines={2}>
          {cityLabel(state.fromCity, locale)} → {cityLabel(state.toCity, locale)}
        </Text>
      </View>

      {eta ? (
        <View style={[styles.eta, { borderColor: colors.line }]}>
          <Text variant="label" tone="muted">
            {state.deliveredAt ? t('tracking.delivered') : t('tracking.expected')}
          </Text>
          <Text variant="heading">{eta}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

function formatRange(fromIso: string, toIso: string, locale: 'ru' | 'kk') {
  const from = formatDate(fromIso, locale);
  const to = formatDate(toIso, locale);
  return from === to ? to : `${from} – ${to}`;
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: { marginTop: spacing.xs },
  route: { marginTop: spacing.lg },
  eta: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, gap: spacing.xxs },
});
