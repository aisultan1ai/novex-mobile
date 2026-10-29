import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Copy, Share2, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { config } from '@/config';
import { haptics } from '@/lib/haptics';
import { Screen, Skeleton, SkeletonGroup, StateView, Text, sizes, spacing, useColors } from '@/ui';

import { Logo } from '@/ui/Logo';

import { TrackingHero } from './components/TrackingHero';
import { TrackingTimeline } from './components/TrackingTimeline';
import { normalizeTrackingNumber, usePublicTracking } from './usePublicTracking';

/**
 * Публичный трекинг — открывается без входа, в том числе по ссылке /tracking/{номер}.
 * Задуман как «скриншотный»: огромный статус, воздух, минимальный таймлайн, вордмарк внизу.
 *
 *   Screen
 *   ├── верхняя панель: закрыть · поделиться
 *   └── ScrollView
 *       ├── перевозчик · трек-номер (копируется)
 *       ├── TrackingHero — статус 44 pt, маршрут, окно доставки
 *       ├── TrackingTimeline
 *       └── «обновлено N минут назад» (без сети) + вордмарк novex
 */
export function TrackingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ number: string }>();
  const number = normalizeTrackingNumber(params.number ?? '');
  const { query, state, events, isStale } = usePublicTracking(number);
  const [copied, setCopied] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/track'));

  const share = () => {
    const url = config.webUrl ? `${config.webUrl}/tracking/${encodeURIComponent(number)}` : null;
    void Share.share({
      message: url
        ? t('tracking.shareWithLink', { number, url })
        : t('tracking.shareNumber', { number }),
    });
  };

  const copy = async () => {
    await Clipboard.setStringAsync(number);
    haptics.select();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const notFound = query.error instanceof ApiError && query.error.status === 404;

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.bar}>
        <IconButton label={t('common.close')} onPress={close}>
          <X color={colors.text} size={24} strokeWidth={1.75} />
        </IconButton>
        {state ? (
          <IconButton label={t('tracking.share')} onPress={share}>
            <Share2 color={colors.text} size={22} strokeWidth={1.75} />
          </IconButton>
        ) : null}
      </View>

      {state ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            onPress={() => void copy()}
            accessibilityRole="button"
            accessibilityLabel={t('tracking.copyNumber', { number })}
            accessibilityHint={copied ? t('tracking.copied') : undefined}
            style={styles.number}
          >
            <Text variant="label" tone="muted" numberOfLines={1} style={styles.numberText}>
              {state.carrierName} · {number}
            </Text>
            {copied ? (
              <Text variant="caption" style={{ color: colors.status.success }}>
                {t('tracking.copied')}
              </Text>
            ) : (
              <Copy color={colors.textMuted} size={16} strokeWidth={1.75} />
            )}
          </Pressable>

          <TrackingHero state={state} />

          <View style={styles.history}>
            <Text variant="label" tone="muted" style={styles.historyTitle}>
              {t('tracking.history')}
            </Text>
            {events ? (
              <TrackingTimeline events={events} tone={state.tone} />
            ) : (
              <Text tone="muted">{t('tracking.historyOffline')}</Text>
            )}
          </View>

          <View style={styles.footer}>
            {isStale ? (
              <Text variant="caption" tone="muted">
                {t('tracking.updatedAgo', { minutes: minutesSince(state.fetchedAt) })}
              </Text>
            ) : null}
            {/* Знак и вордмарк на «скриншотном» экране — узнаваемость при репостах. */}
            <Logo size={22} wordmark accessibilityLabel="Novex" />
          </View>
        </ScrollView>
      ) : query.isPending ? (
        <SkeletonGroup label={t('common.loading')}>
          <View style={styles.content}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="85%" height={48} />
            <Skeleton width="60%" height={28} />
            <Skeleton width="100%" height={120} />
          </View>
        </SkeletonGroup>
      ) : notFound ? (
        <StateView kind="empty" title={t('tracking.notFound')} text={t('tracking.notFoundText')} />
      ) : (
        <StateView kind="error" error={query.error} onRetry={() => void query.refetch()} />
      )}
    </Screen>
  );
}

function IconButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={spacing.xs}
      style={styles.iconButton}
    >
      {children}
    </Pressable>
  );
}

const minutesSince = (iso: string) =>
  Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  iconButton: {
    width: sizes.hitTarget,
    height: sizes.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { gap: spacing.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.xs },
  number: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.hitTarget,
  },
  numberText: { flexShrink: 1 },
  history: { marginTop: spacing.lg },
  historyTitle: { marginBottom: spacing.md },
  footer: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
});
