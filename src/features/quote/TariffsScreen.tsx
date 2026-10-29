import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { useLocale } from '@/i18n/useLocale';
import { cityLabel } from '@/lib/cities';
import { haptics } from '@/lib/haptics';
import { useQuoteDraft } from './quoteDraft';
import { useSessionStore } from '@/store/session';
import {
  Button,
  RequestError,
  Screen,
  Segmented,
  SkeletonCard,
  SkeletonGroup,
  StateView,
  Text,
  sizes,
  spacing,
  useColors,
} from '@/ui';

import { TariffCard } from './components/TariffCard';
import { computeBadges, sortTariffs, type TariffSort } from './tariffs';
import { useCreateDraftFromQuote, useQuoteSession, useSelectTariff } from './useQuote';

/**
 * Тарифы расчёта.
 *   Screen (футер: «Оформить»)
 *   ├── шапка: назад + маршрут «Алматы → Астана»
 *   ├── Segmented: по цене | по сроку
 *   └── FlatList<TariffCard> | скелетоны | пусто | ошибка
 *
 * «Оформить» гостем → Soft Wall (/sign-in); после входа оформление продолжается само.
 */
export function TariffsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const locale = useLocale();
  const params = useLocalSearchParams<{ id: string; token?: string }>();
  const quoteId = Number(params.id);
  const token = params.token || null;

  const route = useQuoteDraft((s) => s.form);
  const session = useSessionStore((s) => s.status);
  const quote = useQuoteSession(quoteId, token);
  const select = useSelectTariff(quoteId, token);
  const createDraft = useCreateDraftFromQuote();

  const [sort, setSort] = useState<TariffSort>('price');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const waitingForLogin = useRef(false);

  const quotes = useMemo(() => quote.data?.quotes ?? [], [quote.data]);
  const sorted = useMemo(() => sortTariffs(quotes, sort), [quotes, sort]);
  const badges = useMemo(() => computeBadges(quotes), [quotes]);
  const chosenId = selectedId ?? quotes.find((q) => q.is_selected)?.id ?? null;

  const checkout = async () => {
    try {
      const draft = await createDraft.mutateAsync({
        quoteSessionId: quoteId,
        publicToken: token,
      });
      router.replace({
        pathname: '/checkout/[draftId]',
        params: { draftId: String(draft.draft_id) },
      });
    } catch {
      haptics.error();
    }
  };

  // Вернулись с Soft Wall уже вошедшими — продолжаем оформление без лишнего нажатия.
  useEffect(() => {
    if (session === 'signedIn' && waitingForLogin.current) {
      waitingForLogin.current = false;
      void checkout();
    }
    // checkout зависит только от стабильных значений экрана
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const onCheckout = async () => {
    if (chosenId == null) return;
    try {
      await select.mutateAsync(chosenId);
    } catch {
      haptics.error();
      return;
    }
    if (session === 'signedIn') {
      await checkout();
    } else {
      waitingForLogin.current = true;
      router.push('/sign-in');
    }
  };

  const busy = select.isPending || createDraft.isPending;
  const routeTitle =
    route.fromCity && route.toCity
      ? `${cityLabel(route.fromCity, locale)} → ${cityLabel(route.toCity, locale)}`
      : t('tariffs.title');

  return (
    <Screen
      footer={
        quotes.length > 0 ? (
          <Button
            title={t('tariffs.checkout')}
            disabled={chosenId == null}
            loading={busy}
            onPress={() => void onCheckout()}
          />
        ) : undefined
      }
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={spacing.xs}
          style={styles.back}
        >
          <ArrowLeft color={colors.text} size={24} strokeWidth={1.75} />
        </Pressable>
        <Text variant="heading" accessibilityRole="header" numberOfLines={2} style={styles.title}>
          {routeTitle}
        </Text>
      </View>

      {quote.isPending ? (
        <SkeletonGroup label={t('common.loading')}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </SkeletonGroup>
      ) : quote.isError ? (
        <StateView kind="error" error={quote.error} onRetry={() => void quote.refetch()} />
      ) : quotes.length === 0 ? (
        <StateView kind="empty" title={t('tariffs.empty')} text={t('tariffs.emptyText')} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(q, i) => String(q.id ?? `${q.carrier_code}-${i}`)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Segmented<TariffSort>
              accessibilityLabel={t('tariffs.sort')}
              value={sort}
              onChange={setSort}
              options={[
                { value: 'price', label: t('tariffs.byPrice') },
                { value: 'eta', label: t('tariffs.byEta') },
              ]}
            />
          }
          ListFooterComponent={<RequestError error={select.error ?? createDraft.error} />}
          renderItem={({ item }) => (
            <TariffCard
              quote={item}
              badges={badges.get(item) ?? { cheapest: false, fastest: false }}
              selected={item.id != null && item.id === chosenId}
              onSelect={() => {
                if (item.id == null || item.id === chosenId) return;
                haptics.select();
                setSelectedId(item.id);
              }}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  back: {
    width: sizes.hitTarget,
    height: sizes.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  title: { flex: 1 },
  list: { gap: spacing.sm, paddingBottom: spacing.md },
});
