import { useRouter } from 'expo-router';
import {
  CircleAlert,
  CircleCheck,
  CreditCard,
  FileText,
  Truck,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { components } from '@/api/schema';
import { useOrders } from '@/features/orders/useOrders';
import { useLocale } from '@/i18n/useLocale';
import { formatDate, formatTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useSessionStore } from '@/store/session';
import {
  Button,
  Chip,
  LargeTitle,
  Screen,
  Skeleton,
  SkeletonGroup,
  StateView,
  Text,
  fonts,
  spacing,
  useCollapsingTitle,
  useColors,
  useScreenInsets,
  type ColorScheme,
} from '@/ui';

import { useMarkAllRead, useMarkRead, useNotifications } from './useNotifications';

type Notification = components['schemas']['NotificationResponse'];

/**
 * Иконка и тинт круга по типу уведомления (DESIGN-TZ 6.11). Бэкенд шлёт статусы заказов одним типом
 * order_status без кода статуса, поэтому красный/зелёный — только когда тип говорит об этом явно.
 */
function visual(type: string, colors: ColorScheme): { icon: LucideIcon; tint: string } {
  if (/fail|reject|cancel|problem/i.test(type))
    return { icon: CircleAlert, tint: colors.dangerTint };
  if (/deliver/i.test(type)) return { icon: CircleCheck, tint: colors.successTint };
  if (/pay/i.test(type)) return { icon: CreditCard, tint: colors.accentTint };
  if (/proof|document|batch/i.test(type)) return { icon: FileText, tint: colors.accentTint };
  return { icon: Truck, tint: colors.accentTint };
}

/** Ссылки бэкенда ведут на страницы сайта — переводим в экраны приложения. */
function orderIdFromLink(link: string | null): number | null {
  if (!link) return null;
  const m = link.match(/\/dashboard\/orders\/(\d+)/) ?? link.match(/[?&]draftId=(\d+)/);
  return m ? Number(m[1]) : null;
}

/**
 * Уведомления (DESIGN-TZ 6.11): largeTitle + «Прочитать все», секции «Сегодня / Вчера / дата»,
 * строки — круг 46 с иконкой, заголовок, текст в одну строку, время, cyan-точка непрочитанного.
 */
export function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useLocale();
  const signedIn = useSessionStore((s) => s.status === 'signedIn');
  const header = useCollapsingTitle(t('tabs.notifications'));
  const list = useNotifications();
  const orders = useOrders().data?.items;
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const items = useMemo(() => list.data?.items ?? [], [list.data]);
  const sections = useMemo(() => groupByDay(items, locale, t), [items, locale, t]);

  const open = (n: Notification) => {
    haptics.select();
    if (!n.is_read) markRead.mutate(n.id);
    const id = orderIdFromLink(n.link_url ?? null);
    if (id == null) return;
    const order = orders?.find((o) => o.draft_id === id);
    if (order?.tracking_number) {
      router.push({ pathname: '/tracking/[number]', params: { number: order.tracking_number } });
    } else {
      router.push({ pathname: '/checkout/[draftId]', params: { draftId: String(id) } });
    }
  };

  let body: ReactNode;
  if (!signedIn) {
    body = (
      <View style={styles.guest}>
        <StateView
          kind="empty"
          title={t('notifications.guestTitle')}
          text={t('notifications.guestText')}
        />
        <Button title={t('auth.signIn')} onPress={() => router.push('/sign-in')} />
      </View>
    );
  } else if (list.isPending) {
    body = (
      <SkeletonGroup label={t('common.loading')}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={60} />
        ))}
      </SkeletonGroup>
    );
  } else if (list.isError) {
    body = <StateView kind="error" error={list.error} onRetry={() => void list.refetch()} />;
  } else if (items.length === 0) {
    body = (
      <StateView
        kind="empty"
        title={t('notifications.emptyTitle')}
        text={t('notifications.emptyText')}
      />
    );
  } else {
    body = sections.map((s) => (
      <View key={s.key} style={styles.section}>
        <Text variant="label" tone="muted" style={styles.sectionTitle} accessibilityRole="header">
          {s.title}
        </Text>
        {s.items.map((n) => (
          <NotificationRow key={n.id} item={n} onPress={() => open(n)} />
        ))}
      </View>
    ));
  }

  const unread = list.data?.unread_count ?? 0;

  return (
    <Screen withTabBar overlay={header.overlay}>
      <NotificationsScroll onScroll={header.onScroll}>
        <LargeTitle
          title={t('tabs.notifications')}
          right={
            signedIn && unread > 0 ? (
              <Chip
                height={36}
                label={t('notifications.markAllRead')}
                onPress={() => markAll.mutate()}
              />
            ) : undefined
          }
        />
        {body}
      </NotificationsScroll>
    </Screen>
  );
}

function NotificationRow({ item, onPress }: { item: Notification; onPress: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  const { icon: Icon, tint } = visual(item.type, colors);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        item.title,
        item.body,
        formatTime(item.created_at),
        item.is_read ? null : t('notifications.unread'),
      ]
        .filter(Boolean)
        .join(', ')}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: tint }]}>
        <Icon color={colors.text} size={21} strokeWidth={1.6} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.body ? (
          <Text variant="label" tone="muted" numberOfLines={1}>
            {item.body}
          </Text>
        ) : null}
      </View>
      <View style={styles.meta}>
        <Text variant="caption" tone="muted">
          {formatTime(item.created_at)}
        </Text>
        <View
          style={[styles.dot, { backgroundColor: item.is_read ? 'transparent' : colors.accent }]}
        />
      </View>
    </Pressable>
  );
}

function groupByDay(
  items: Notification[],
  locale: 'ru' | 'kk',
  t: (key: 'notifications.today' | 'notifications.yesterday') => string,
) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const sections = new Map<string, { key: string; title: string; items: Notification[] }>();
  for (const n of [...items].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const d = new Date(n.created_at);
    const key = dayKey(d);
    const title =
      key === dayKey(today)
        ? t('notifications.today')
        : key === dayKey(yesterday)
          ? t('notifications.yesterday')
          : formatDate(d, locale);
    if (!sections.has(key)) sections.set(key, { key, title, items: [] });
    sections.get(key)!.items.push(n);
  }
  return [...sections.values()];
}

function NotificationsScroll({
  children,
  onScroll,
}: {
  children: ReactNode;
  onScroll: Parameters<typeof ScrollView>[0]['onScroll'];
}) {
  const insets = useScreenInsets();
  return (
    <ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.md }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guest: { gap: spacing.md, paddingTop: spacing.xl },
  section: { marginTop: 22 },
  sectionTitle: { fontFamily: fonts.semibold, marginBottom: spacing.xxs },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: spacing.sm },
  pressed: { opacity: 0.7 },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 3 },
  title: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, letterSpacing: -0.15 },
  meta: { alignItems: 'flex-end', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
