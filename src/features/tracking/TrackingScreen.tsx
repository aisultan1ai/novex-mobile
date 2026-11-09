import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/errors';
import { config } from '@/config';
import { useLocale } from '@/i18n/useLocale';
import { cityLabel } from '@/lib/cities';
import { formatDate, formatTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { isKnownStatus } from '@/lib/orderStatus';
import {
  Button,
  GlassSurface,
  RouteCodes,
  Screen,
  Skeleton,
  SkeletonGroup,
  StatTile,
  StateView,
  Text,
  Timeline,
  fonts,
  lightColors,
  motion,
  radii,
  screenPadding,
  sizes,
  spacing,
  useColors,
  useIsDark,
  type TimelineItem,
} from '@/ui';

import { MAP_HEIGHT, TrackingMap } from './components/TrackingMap';
import type { ShipmentLiveState } from './liveState';
import { normalizeTrackingNumber, usePublicTracking } from './usePublicTracking';

/** После этой прокрутки шапка становится светлым стеклом с заголовком (DESIGN-TZ 6.8). */
const COLLAPSE_AT = 380;
const SHEET_OVERLAP = 28;

/**
 * Трекинг (DESIGN-TZ 6.8) — и для своих заказов, и публичный по ссылке /tracking/{номер} без входа.
 *
 *   ScrollView
 *   ├── TrackingMap — тёмная статичная схема ≈500 pt (координат курьера в API нет)
 *   └── лист (радиус 28, наезжает на схему на 28 pt, «ручка»)
 *       ├── RouteCodes lg с городами и датами
 *       ├── StatTile «Трек-номер» (нажатие = копировать) · StatTile «Ожидаемая доставка»
 *       ├── «Статус доставки» — Timeline из событий
 *       └── «Поделиться трекингом»
 *   overlay: «назад» — стекло на схеме, после 380 pt шапка светлая с «{статус} · {дата}»
 *
 * «Позвонить» не показываем: в публичном трекинге телефона курьера нет.
 */
export function TrackingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ number: string }>();
  const number = normalizeTrackingNumber(params.number ?? '');
  const { query, state, events, isStale } = usePublicTracking(number);
  const [collapsed, setCollapsed] = useState(false);
  const locale = useLocale();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/track'));
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = e.nativeEvent.contentOffset.y > COLLAPSE_AT;
    if (next !== collapsed) setCollapsed(next);
  };

  const notFound = query.error instanceof ApiError && query.error.status === 404;
  const headerTitle = state
    ? [
        isKnownStatus(state.status)
          ? t(`orderStatus.${state.status}`)
          : t(`statusGroup.${state.group}`),
        state.deliveredAt || state.etaTo
          ? formatDate((state.deliveredAt ?? state.etaTo)!, locale)
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <Screen
      padded={false}
      edges={[]}
      overlay={
        <TrackingHeader collapsed={collapsed && !!state} title={headerTitle} onBack={close} />
      }
    >
      <StatusBar style={collapsed || !state ? 'auto' : 'light'} />
      {state ? (
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <TrackingMap
            mode={state.phase === 'outForDelivery' ? 'city' : 'intercity'}
            fromLabel={cityLabel(state.fromCity, locale)}
            toLabel={cityLabel(state.toCity, locale)}
            badge={state.phase === 'outForDelivery' ? t('tracking.courierOnTheWay') : undefined}
          />
          <TrackingSheet number={number} state={state} events={events} isStale={isStale} />
        </ScrollView>
      ) : query.isPending ? (
        <SkeletonGroup label={t('common.loading')}>
          <Skeleton height={MAP_HEIGHT} radius={0} />
          <View style={styles.skeletonSheet}>
            <Skeleton height={120} radius={radii.card} />
            <Skeleton height={72} radius={radii.tile} />
            <Skeleton width="60%" height={18} />
          </View>
        </SkeletonGroup>
      ) : (
        <View style={styles.state}>
          {notFound ? (
            <StateView
              kind="empty"
              title={t('tracking.notFound')}
              text={t('tracking.notFoundText')}
            />
          ) : (
            <StateView kind="error" error={query.error} onRetry={() => void query.refetch()} />
          )}
        </View>
      )}
    </Screen>
  );
}

function TrackingSheet({
  number,
  state,
  events,
  isStale,
}: {
  number: string;
  state: ShipmentLiveState;
  events:
    | { status: string; description: string | null; location: string | null; occurred_at: string }[]
    | null;
  isStale: boolean;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const locale = useLocale();
  const safe = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  const fromCaption = events?.length
    ? stamp(events[events.length - 1]!.occurred_at, locale)
    : undefined;
  const toCaption = state.deliveredAt
    ? stamp(state.deliveredAt, locale)
    : state.etaTo
      ? t('tracking.until', { date: formatDate(state.etaTo, locale) })
      : undefined;
  const expected = state.deliveredAt
    ? stamp(state.deliveredAt, locale)
    : state.etaFrom && state.etaTo
      ? range(state.etaFrom, state.etaTo, locale)
      : '—';

  const items = useMemo<TimelineItem[]>(() => {
    const sorted = [...(events ?? [])].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
    return sorted.map((e, i) => ({
      key: `${e.occurred_at}-${i}`,
      title: e.description || (isKnownStatus(e.status) ? t(`orderStatus.${e.status}`) : e.status),
      meta: [e.location ? cityLabel(e.location, locale) : null, stamp(e.occurred_at, locale)]
        .filter(Boolean)
        .join(' · '),
      current: i === 0,
    }));
  }, [events, t, locale]);

  const copy = async () => {
    await Clipboard.setStringAsync(number);
    haptics.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = () => {
    const url = config.webUrl ? `${config.webUrl}/tracking/${encodeURIComponent(number)}` : null;
    void Share.share({
      message: url
        ? t('tracking.shareWithLink', { number, url })
        : t('tracking.shareNumber', { number }),
    });
  };

  return (
    <View
      style={[
        styles.sheet,
        { backgroundColor: colors.background, paddingBottom: safe.bottom + spacing.xl },
      ]}
    >
      <View style={[styles.handle, { backgroundColor: colors.lineStrong }]} />

      <View style={[styles.routeCard, { borderColor: colors.line }]}>
        <RouteCodes
          from={state.fromCity}
          to={state.toCity}
          size="lg"
          arrow
          showCities
          fromCaption={fromCaption}
          toCaption={toCaption}
        />
      </View>

      <View style={styles.tiles}>
        <StatTile
          label={t('tracking.trackNumber')}
          value={copied ? t('common.copied') : number}
          onPress={() => void copy()}
          accessibilityLabel={t('tracking.copyNumber', { number })}
          accessibilityHint={copied ? t('common.copied') : undefined}
        />
        <StatTile
          label={state.deliveredAt ? t('tracking.delivered') : t('tracking.expectedDelivery')}
          value={expected}
          tone="strong"
        />
      </View>

      <Text variant="section" accessibilityRole="header" style={styles.sectionTitle}>
        {t('tracking.history')}
      </Text>
      {items.length > 0 ? (
        <Timeline items={items} accessibilityLabel={t('tracking.history')} />
      ) : (
        <Text tone="muted">
          {events ? t('tracking.historyEmpty') : t('tracking.historyOffline')}
        </Text>
      )}

      {isStale ? (
        <Text variant="caption" tone="muted" style={styles.stale}>
          {t('tracking.updatedAgo', { minutes: minutesSince(state.fetchedAt) })}
        </Text>
      ) : null}

      <Button title={t('tracking.shareCta')} onPress={share} style={styles.share} />
    </View>
  );
}

function TrackingHeader({
  collapsed,
  title,
  onBack,
}: {
  collapsed: boolean;
  title: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const isDark = useIsDark();
  const safe = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(collapsed ? 1 : 0);

  useEffect(() => {
    const to = collapsed ? 1 : 0;
    progress.set(reduceMotion ? to : withTiming(to, { duration: motion.slow }));
  }, [collapsed, reduceMotion, progress]);

  const barStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const onLight = collapsed;
  const iconColor = onLight ? colors.text : lightColors.onStrong;

  return (
    <View style={[styles.header, { paddingTop: safe.top }]} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, barStyle]} pointerEvents="none">
        <GlassSurface variant={isDark ? 'dark' : 'light'} style={styles.headerGlass} />
      </Animated.View>
      <View style={styles.headerRow} pointerEvents="box-none">
        {onLight ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            style={[styles.round, { backgroundColor: colors.divider }]}
          >
            <ArrowLeft color={iconColor} size={22} strokeWidth={2} />
          </Pressable>
        ) : (
          <GlassSurface variant="onDark" style={styles.round}>
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              style={styles.roundInner}
            >
              <ArrowLeft color={iconColor} size={22} strokeWidth={2} />
            </Pressable>
          </GlassSurface>
        )}
        <Text
          style={[styles.headerTitle, { opacity: collapsed ? 1 : 0 }]}
          numberOfLines={1}
          accessibilityElementsHidden={!collapsed}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

const stamp = (iso: string, locale: 'ru' | 'kk') =>
  `${formatDate(iso, locale)}, ${formatTime(iso)}`;

function range(fromIso: string, toIso: string, locale: 'ru' | 'kk') {
  const from = formatDate(fromIso, locale);
  const to = formatDate(toIso, locale);
  return from === to ? to : `${from} – ${to}`;
}

const minutesSince = (iso: string) =>
  Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));

const styles = StyleSheet.create({
  state: { flex: 1, paddingHorizontal: screenPadding, justifyContent: 'center' },
  skeletonSheet: { padding: screenPadding, gap: spacing.sm },
  sheet: {
    marginTop: -SHEET_OVERLAP,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: 10,
    paddingHorizontal: screenPadding,
  },
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center' },
  routeCard: { marginTop: 18, padding: 18, borderRadius: radii.card, borderWidth: 1 },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 10 },
  sectionTitle: { marginTop: spacing.lg, marginBottom: 14, fontSize: 17 },
  stale: { marginTop: spacing.sm },
  share: { marginTop: spacing.lg },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerGlass: { flex: 1, borderRadius: 0 },
  headerRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
  },
  round: {
    width: sizes.hitTarget,
    height: sizes.hitTarget,
    borderRadius: sizes.hitTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundInner: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: 16 },
});
