import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { components } from '@/api/schema';
import { useLocale } from '@/i18n/useLocale';
import { formatDate, formatTime } from '@/lib/format';
import { isKnownStatus, type StatusTone } from '@/lib/orderStatus';
import { Text, spacing, useColors } from '@/ui';

type TrackingEvent = components['schemas']['PublicTrackingEventResponse'];

/** Минималистичный таймлайн: точки и тонкая линия, свежее событие сверху и в цвете статуса. */
export function TrackingTimeline({ events, tone }: { events: TrackingEvent[]; tone: StatusTone }) {
  const { t } = useTranslation();
  const colors = useColors();
  const locale = useLocale();
  const sorted = [...events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

  if (sorted.length === 0) {
    return (
      <Text tone="muted" style={styles.empty}>
        {t('tracking.historyEmpty')}
      </Text>
    );
  }

  return (
    <View accessibilityRole="list" accessibilityLabel={t('tracking.history')}>
      {sorted.map((event, index) => {
        const first = index === 0;
        const last = index === sorted.length - 1;
        const label =
          event.description ||
          (isKnownStatus(event.status) ? t(`orderStatus.${event.status}`) : event.status);
        const meta = [
          event.location,
          `${formatDate(event.occurred_at, locale)}, ${formatTime(event.occurred_at)}`,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <View key={`${event.occurred_at}-${index}`} style={styles.item} accessible>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  first
                    ? { backgroundColor: colors.status[tone], width: 12, height: 12 }
                    : { backgroundColor: colors.line },
                ]}
              />
              {last ? null : <View style={[styles.line, { backgroundColor: colors.line }]} />}
            </View>
            <View style={styles.body}>
              <Text variant={first ? 'bodyStrong' : 'body'} tone={first ? 'default' : 'muted'}>
                {label}
              </Text>
              <Text variant="caption" tone="muted">
                {meta}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: spacing.sm },
  rail: { width: 12, alignItems: 'center', paddingTop: 5 },
  dot: { width: 8, height: 8, borderRadius: 6 },
  line: { flex: 1, width: 1, marginTop: spacing.xxs },
  body: { flex: 1, gap: 2, paddingBottom: spacing.lg },
  empty: { paddingVertical: spacing.md },
});
