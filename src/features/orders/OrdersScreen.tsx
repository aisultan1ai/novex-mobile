import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type ComponentRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { useLocale } from '@/i18n/useLocale';
import { cityLabel } from '@/lib/cities';
import { formatDate, formatMoney, monthIn } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { describeStatus, isKnownStatus } from '@/lib/orderStatus';
import { useSessionStore } from '@/store/session';
import {
  Button,
  Chip,
  LargeTitle,
  Screen,
  SearchField,
  Skeleton,
  SkeletonGroup,
  StateView,
  Text,
  TicketCard,
  fonts,
  radii,
  spacing,
  useCollapsingTitle,
  useColors,
  useScreenInsets,
} from '@/ui';
import { OpenBoxIllustration } from '@/ui/illustrations';

import { TicketExpand, type Rect } from './TicketExpand';
import {
  groupByMonth,
  matchesSearch,
  orderFilter,
  useOrders,
  type Order,
  type OrderFilter,
} from './useOrders';

const FILTERS: OrderFilter[] = ['active', 'delivered', 'cancelled'];

/**
 * Заказы (DESIGN-TZ 6.10).
 *   largeTitle «Заказы» (при прокрутке — стеклянная шапка) · поиск · чипы «Активные · N / Доставлены / Отменены»
 *   активные — TicketCard; доставленные и отменённые — строки по месяцам
 *   нажатие на билет — раскрытие в трекинг; пусто — OpenBox и «Рассчитать доставку»; гость — «Войти»
 */
export function OrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const signedIn = useSessionStore((s) => s.status === 'signedIn');
  const orders = useOrders();
  const header = useCollapsingTitle(t('tabs.orders'));
  const [filter, setFilter] = useState<OrderFilter>('active');
  const [query, setQuery] = useState('');
  const [expand, setExpand] = useState<{ rect: Rect; order: Order } | null>(null);

  const all = useMemo(() => orders.data?.items ?? [], [orders.data]);
  const counts = useMemo(() => {
    const c: Record<OrderFilter, number> = { active: 0, delivered: 0, cancelled: 0 };
    for (const o of all) c[orderFilter(o)] += 1;
    return c;
  }, [all]);
  const visible = useMemo(
    () => all.filter((o) => orderFilter(o) === filter && matchesSearch(o, query)),
    [all, filter, query],
  );
  const recentDelivered = useMemo(
    () => groupByMonth(all.filter((o) => orderFilter(o) === 'delivered'))[0],
    [all],
  );

  const openOrder = useCallback(
    (order: Order) => {
      if (order.tracking_number) {
        router.push({ pathname: '/tracking/[number]', params: { number: order.tracking_number } });
      } else {
        router.push({
          pathname: '/checkout/[draftId]',
          params: { draftId: String(order.draft_id) },
        });
      }
    },
    [router],
  );

  const onTicket = (order: Order, e: GestureResponderEvent) => {
    haptics.select();
    const target = e.currentTarget as unknown as ComponentRef<typeof View> | null;
    if (reduceMotion || !order.tracking_number || !target?.measureInWindow) {
      openOrder(order);
      return;
    }
    target.measureInWindow((x, y, width, height) =>
      setExpand({ rect: { x, y, width, height }, order }),
    );
  };

  const finishExpand = useCallback(() => {
    if (!expand) return;
    openOrder(expand.order);
    setTimeout(() => setExpand(null), 120);
  }, [expand, openOrder]);

  let body: ReactNode;
  if (!signedIn) {
    body = (
      <EmptyOrders
        title={t('orders.guestTitle')}
        text={t('orders.guestText')}
        primary={{ title: t('auth.signIn'), onPress: () => router.push('/sign-in') }}
        secondary={{ title: t('orders.haveTrackNumber'), onPress: () => router.push('/track') }}
      />
    );
  } else if (orders.isPending) {
    body = (
      <SkeletonGroup label={t('common.loading')}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={124} radius={radii.card} />
        ))}
      </SkeletonGroup>
    );
  } else if (orders.isError) {
    body = <StateView kind="error" error={orders.error} onRetry={() => void orders.refetch()} />;
  } else if (all.length === 0) {
    body = (
      <EmptyOrders
        title={t('orders.emptyTitle')}
        text={t('orders.emptyText')}
        primary={{ title: t('orders.calculate'), onPress: () => router.push('/') }}
        secondary={{ title: t('orders.haveTrackNumber'), onPress: () => router.push('/track') }}
      />
    );
  } else {
    body = (
      <>
        <SearchField
          label={t('orders.search')}
          placeholder={t('orders.search')}
          value={query}
          onChangeText={setQuery}
        />
        <View style={styles.filters} accessibilityRole="tablist">
          {FILTERS.map((f) => (
            <Chip
              key={f}
              height={38}
              label={
                f === 'active' && counts.active > 0
                  ? `${t('orders.filters.active')} · ${counts.active}`
                  : t(`orders.filters.${f}`)
              }
              selected={filter === f}
              onPress={() => {
                if (filter === f) return;
                haptics.select();
                setFilter(f);
              }}
            />
          ))}
        </View>

        {visible.length === 0 ? (
          <StateView kind="empty" title={t('orders.nothingFound')} />
        ) : filter === 'active' ? (
          <View style={styles.tickets}>
            {visible.map((o) => (
              <OrderTicket key={o.draft_id} order={o} onPress={(e) => onTicket(o, e)} />
            ))}
          </View>
        ) : (
          groupByMonth(visible).map((g) => (
            <OrderSection
              key={g.key}
              date={g.date}
              filter={filter}
              items={g.items}
              onPress={openOrder}
            />
          ))
        )}

        {filter === 'active' && !query && recentDelivered ? (
          <OrderSection
            date={recentDelivered.date}
            filter="delivered"
            items={recentDelivered.items}
            onPress={openOrder}
          />
        ) : null}
      </>
    );
  }

  return (
    <Screen withTabBar overlay={header.overlay}>
      <OrdersScroll onScroll={header.onScroll}>
        <LargeTitle title={t('tabs.orders')} />
        {body}
      </OrdersScroll>
      <TicketExpand from={expand?.rect ?? null} onDone={finishExpand} />
    </Screen>
  );
}

function OrderTicket({
  order,
  onPress,
}: {
  order: Order;
  onPress: (e: GestureResponderEvent) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const from = cityLabel(order.from_city_snapshot, locale);
  const to = cityLabel(order.to_city_snapshot, locale);
  const status = isKnownStatus(order.status)
    ? t(`orderStatus.${order.status}`)
    : t(`statusGroup.${describeStatus(order.status).group}`);
  const date = formatDate(order.created_at, locale);
  const price = formatMoney(order.price_snapshot);
  return (
    <TicketCard
      from={order.from_city_snapshot}
      to={order.to_city_snapshot}
      citiesLabel={`${from} → ${to}`}
      status={order.status}
      statusLabel={status}
      date={date}
      carrierCode={order.carrier_code_snapshot}
      carrierName={order.carrier_name_snapshot}
      price={price}
      onPress={onPress}
      accessibilityLabel={[
        `${from} — ${to}`,
        status,
        date,
        order.carrier_name_snapshot,
        price,
      ].join(', ')}
    />
  );
}

function OrderSection({
  date,
  filter,
  items,
  onPress,
}: {
  date: string;
  filter: OrderFilter;
  items: Order[];
  onPress: (order: Order) => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const locale = useLocale();
  const raw =
    filter === 'delivered'
      ? t('orders.deliveredIn', { month: monthIn(date, locale) })
      : t('orders.cancelledIn', { month: monthIn(date, locale) });
  // В казахском заголовок начинается с месяца («қазанда жеткізілді») — первая буква заглавная.
  const heading = raw.charAt(0).toLocaleUpperCase(locale) + raw.slice(1);
  return (
    <View style={styles.section}>
      <Text variant="section" accessibilityRole="header">
        {heading}
      </Text>
      <View style={styles.rows}>
        {items.map((o) => {
          const route = `${cityLabel(o.from_city_snapshot, locale)} → ${cityLabel(o.to_city_snapshot, locale)}`;
          const meta = `${formatDate(o.created_at, locale)} · ${o.carrier_name_snapshot}`;
          const price = formatMoney(o.price_snapshot);
          return (
            <Pressable
              key={o.draft_id}
              onPress={() => onPress(o)}
              accessibilityRole="button"
              accessibilityLabel={`${route}, ${meta}, ${price}`}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.line },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {route}
                </Text>
                <Text variant="label" tone="muted" numberOfLines={1}>
                  {meta}
                </Text>
              </View>
              <Text style={styles.rowTitle}>{price}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EmptyOrders({
  title,
  text,
  primary,
  secondary,
}: {
  title: string;
  text: string;
  primary: { title: string; onPress: () => void };
  secondary: { title: string; onPress: () => void };
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.illustration}>
        <OpenBoxIllustration />
      </View>
      <Text variant="largeTitle" accessibilityRole="header" style={styles.emptyTitle}>
        {title}
      </Text>
      <Text tone="muted" style={styles.emptyText}>
        {text}
      </Text>
      <View style={styles.emptyActions}>
        <Button title={primary.title} onPress={primary.onPress} />
        <Button variant="ghost" title={secondary.title} onPress={secondary.onPress} />
      </View>
    </View>
  );
}

function OrdersScroll({
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
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.md }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md - 2 },
  filters: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  tickets: { gap: spacing.sm, marginTop: spacing.xxs },
  section: { marginTop: spacing.md },
  rows: { marginTop: spacing.xxs },
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  rowText: { flex: 1, paddingVertical: spacing.xs },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  pressed: { opacity: 0.7 },
  empty: { paddingTop: spacing.xxl },
  illustration: { alignItems: 'center' },
  emptyTitle: { marginTop: spacing.xxl },
  emptyText: { marginTop: spacing.sm, fontSize: 16, lineHeight: 24 },
  emptyActions: { marginTop: spacing.xl, gap: 6 },
});
