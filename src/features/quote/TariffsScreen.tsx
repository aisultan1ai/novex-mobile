import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';

import { formatMoney } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useSessionStore } from '@/store/session';
import {
  BottomBar,
  Chip,
  GlassSurface,
  RequestError,
  RouteCodes,
  Screen,
  Skeleton,
  SkeletonGroup,
  StateView,
  Text,
  fonts,
  radii,
  screenPadding,
  sizes,
  spacing,
  useColors,
  useScreenInsets,
} from '@/ui';

import { TariffCard } from './components/TariffCard';
import { useQuoteDraft } from './quoteDraft';
import { matchPreset } from './quoteForm';
import { computeBadges, sortTariffs, type TariffSort } from './tariffs';
import { useCreateDraftFromQuote, useQuoteSession, useSelectTariff } from './useQuote';

const ANDROID = Platform.OS === 'android';
const HEADER = ANDROID ? 64 : 44;

/**
 * Тарифы (DESIGN-TZ 6.4).
 *   Screen
 *   ├── overlay: стеклянная шапка «назад · Тарифы» (контент прокручивается под ней)
 *   ├── RouteCodes md + «Посылка M · 3,5 кг · тарифов: N»
 *   ├── чипы сортировки
 *   ├── TariffCard × N | скелетоны | пусто | ошибка
 *   └── footer: BottomBar — прогресс 25 %, итог выбранного тарифа, «Оформить»
 *
 * «Оформить» гостем → Soft Wall (/sign-in); после входа оформление продолжается само.
 */
export function TariffsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; token?: string }>();
  const quoteId = Number(params.id);
  const token = params.token || null;

  const form = useQuoteDraft((s) => s.form);
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
  const chosen = quotes.find((q) => q.id === chosenId);

  const checkout = async () => {
    try {
      const draft = await createDraft.mutateAsync({ quoteSessionId: quoteId, publicToken: token });
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

  const preset = matchPreset(form);
  const kind = form.shipmentType === 'document' ? t('quote.document') : t('quote.parcel');
  const summary = [
    preset && form.shipmentType === 'parcel' ? `${kind} ${preset}` : kind,
    t('tariffs.weight', { kg: form.weightKg }),
    quote.data ? t('tariffs.found', { count: quotes.length }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen
      padded={false}
      overlay={<TariffsHeader title={t('tariffs.title')} onBack={() => router.back()} />}
      footer={
        quotes.length > 0 ? (
          <BottomBar
            totalLabel={t('tariffs.total')}
            total={chosen ? formatMoney(chosen.price) : undefined}
            progress={0.25}
            progressFrom={0}
            cta={{
              title: t('tariffs.checkout'),
              disabled: chosenId == null,
              loading: select.isPending || createDraft.isPending,
              onPress: () => void onCheckout(),
            }}
          />
        ) : undefined
      }
    >
      <TariffsList
        header={
          <View style={styles.head}>
            {form.fromCity && form.toCity ? (
              <RouteCodes from={form.fromCity} to={form.toCity} size="md" />
            ) : null}
            <Text variant="label" tone="muted" style={styles.summary}>
              {summary}
            </Text>
            <View style={styles.sorts} accessibilityRole="radiogroup">
              {(['price', 'eta'] as const).map((value) => (
                <Chip
                  key={value}
                  variant="outline"
                  label={value === 'price' ? t('tariffs.sortCheap') : t('tariffs.sortFast')}
                  selected={sort === value}
                  onPress={() => {
                    if (sort === value) return;
                    haptics.select();
                    setSort(value);
                  }}
                />
              ))}
            </View>
          </View>
        }
        state={
          quote.isPending ? (
            <SkeletonGroup label={t('common.loading')}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={ANDROID ? 80 : 90} radius={ANDROID ? 0 : radii.card} />
              ))}
            </SkeletonGroup>
          ) : quote.isError ? (
            <StateView kind="error" error={quote.error} onRetry={() => void quote.refetch()} />
          ) : quotes.length === 0 ? (
            <StateView kind="empty" title={t('tariffs.empty')} text={t('tariffs.emptyText')} />
          ) : null
        }
        data={quote.isPending || quote.isError ? [] : sorted}
        renderItem={(item) => (
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
        footer={<RequestError error={select.error ?? createDraft.error} />}
      />
    </Screen>
  );
}

type Quote = ReturnType<typeof sortTariffs>[number];

function TariffsList({
  header,
  state,
  data,
  renderItem,
  footer,
}: {
  header: ReactElement;
  state: ReactNode;
  data: Quote[];
  renderItem: (item: Quote) => ReactElement;
  footer: ReactElement;
}) {
  const insets = useScreenInsets();
  return (
    <FlatList
      data={data}
      keyExtractor={(q, i) => String(q.id ?? `${q.carrier_code}-${i}`)}
      renderItem={({ item }) => renderItem(item)}
      ListHeaderComponent={
        <>
          {header}
          {state}
        </>
      }
      ListFooterComponent={footer}
      contentContainerStyle={[
        styles.list,
        { paddingTop: HEADER + spacing.sm, paddingBottom: insets.bottom + spacing.lg },
      ]}
      ItemSeparatorComponent={ANDROID ? undefined : Separator}
      showsVerticalScrollIndicator={false}
    />
  );
}

function TariffsHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <GlassSurface style={[styles.header, { height: HEADER }]} bordered={false}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        style={styles.back}
      >
        <ArrowLeft color={colors.text} size={24} strokeWidth={1.75} />
      </Pressable>
      <Text
        accessibilityRole="header"
        style={[styles.headerTitle, ANDROID ? styles.headerTitleAndroid : styles.headerTitleIos]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {ANDROID ? null : <View style={styles.back} />}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ANDROID ? 4 : spacing.xs,
    borderRadius: 0,
  },
  back: {
    width: sizes.hitTarget,
    height: sizes.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1 },
  headerTitleIos: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 18 },
  headerTitleAndroid: { fontFamily: fonts.semibold, fontSize: 20 },
  list: { paddingHorizontal: screenPadding },
  head: { gap: spacing.xxs, marginBottom: spacing.md },
  summary: { fontSize: 14 },
  sorts: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  gap: { height: spacing.sm },
});

function Separator() {
  return <View style={styles.gap} />;
}
