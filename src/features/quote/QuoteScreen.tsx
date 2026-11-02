import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { FileText, Package } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { fieldError, onInvalidForm } from '@/lib/forms';
import { haptics } from '@/lib/haptics';
import {
  Button,
  Chip,
  RequestError,
  Screen,
  Sheet,
  Text,
  screenPadding,
  sizes,
  spacing,
  useScreenInsets,
} from '@/ui';

import { HomeHeader } from './components/HomeHeader';
import { ParcelFields } from './components/ParcelFields';
import { RouteCard } from './components/RouteCard';
import { SizePresets } from './components/SizePresets';
import { useQuoteDraft } from './quoteDraft';
import {
  SIZE_PRESETS,
  matchPreset,
  quoteSchema,
  toQuoteRequest,
  type QuoteFormValues,
  type ShipmentType,
} from './quoteForm';
import { useCalculateQuote } from './useQuote';

/**
 * Главный экран — расчёт стоимости (DESIGN-TZ 6.3). Доступен гостю: вход понадобится только на «Оформить».
 *
 *   Screen (вкладка; футер «Рассчитать» над таб-баром)
 *   ├── HomeHeader ─ аватар, «Привет, {имя}», колокольчик
 *   ├── largeTitle «Куда отправим / посылку?»
 *   ├── RouteCard ─ коды городов, «Откуда» / «Куда», кнопка «поменять»
 *   ├── «Что отправляете» ─ чипы Посылка / Документы
 *   ├── «Размер» + «Как измерить» ─ SizePresets S / M / L (только посылка)
 *   ├── ParcelFields ─ вес и места (+ свои габариты)
 *   └── RequestError
 *
 * «Груз» из макета не показываем: бэкенд принимает только parcel и document.
 */
export function QuoteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const saved = useQuoteDraft((s) => s.form);
  const save = useQuoteDraft((s) => s.save);
  const calc = useCalculateQuote();
  const [customDims, setCustomDims] = useState(false);
  const [measureOpen, setMeasureOpen] = useState(false);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: saved,
  });
  const { control, setValue, getValues, formState } = form;
  const from = useController({ control, name: 'fromCity' });
  const to = useController({ control, name: 'toCity' });

  // Черновик формы восстанавливается из хранилища асинхронно — подставляем, пока клиент не начал ввод.
  useEffect(() => {
    return useQuoteDraft.persist.onFinishHydration((state) => {
      if (!form.formState.isDirty) form.reset(state.form);
    });
  }, [form]);

  const [shipmentType, widthCm, heightCm, depthCm] = useWatch({
    control,
    name: ['shipmentType', 'widthCm', 'heightCm', 'depthCm'],
  });
  const preset = customDims ? null : matchPreset({ widthCm, heightCm, depthCm });
  const isParcel = shipmentType === 'parcel';

  const submit = form.handleSubmit(async (values) => {
    save(values);
    try {
      const data = await calc.mutateAsync(toQuoteRequest(values));
      router.push({
        pathname: '/quote/[id]',
        params: { id: String(data.quote_session_id), token: data.public_token ?? '' },
      });
    } catch {
      haptics.error();
    }
  }, onInvalidForm);

  // До первой отправки не ругаемся на поля, которые клиент ещё заполняет.
  const changeOpts = () => ({ shouldDirty: true, shouldValidate: formState.isSubmitted });

  const kinds: { value: ShipmentType; label: string; icon: typeof Package }[] = [
    { value: 'parcel', label: t('quote.parcel'), icon: Package },
    { value: 'document', label: t('quote.document'), icon: FileText },
  ];

  return (
    <Screen
      withTabBar
      footer={
        <View style={styles.footer}>
          <Button
            title={calc.isPending ? t('quote.calculating') : t('quote.calculate')}
            loading={calc.isPending}
            onPress={() => void submit()}
          />
        </View>
      }
    >
      <QuoteContent>
        <HomeHeader />
        <Text variant="largeTitle" accessibilityRole="header" style={styles.title}>
          {t('quote.title')}
        </Text>

        <RouteCard
          from={from.field.value}
          to={to.field.value}
          onChangeFrom={(v) => setValue('fromCity', v, changeOpts())}
          onChangeTo={(v) => setValue('toCity', v, changeOpts())}
          onSwap={() => {
            const { fromCity, toCity } = getValues();
            setValue('fromCity', toCity, changeOpts());
            setValue('toCity', fromCity, changeOpts());
          }}
          fromError={fieldError(t, from.fieldState.error)}
          toError={fieldError(t, to.fieldState.error)}
        />

        <View style={styles.section}>
          <Text variant="section" accessibilityRole="header">
            {t('quote.what')}
          </Text>
          <View style={styles.kinds} accessibilityRole="radiogroup">
            {kinds.map((k) => (
              <Chip
                key={k.value}
                variant="outline"
                stretch={Platform.OS !== 'android'}
                height={46}
                icon={k.icon}
                label={k.label}
                selected={shipmentType === k.value}
                onPress={() => {
                  if (shipmentType === k.value) return;
                  haptics.select();
                  setValue('shipmentType', k.value, changeOpts());
                }}
              />
            ))}
          </View>
        </View>

        {isParcel ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text variant="section" accessibilityRole="header">
                {t('quote.size')}
              </Text>
              <Pressable
                onPress={() => setMeasureOpen(true)}
                accessibilityRole="button"
                hitSlop={spacing.sm}
              >
                <Text variant="label" tone="muted" style={styles.link}>
                  {t('quote.howToMeasure')}
                </Text>
              </Pressable>
            </View>
            <SizePresets
              value={preset}
              onSelect={(name) => {
                const p = SIZE_PRESETS[name];
                setCustomDims(false);
                setValue('weightKg', p.weightKg, changeOpts());
                setValue('widthCm', p.widthCm, changeOpts());
                setValue('heightCm', p.heightCm, changeOpts());
                setValue('depthCm', p.depthCm, changeOpts());
              }}
            />
            {preset ? (
              <Pressable
                onPress={() => setCustomDims(true)}
                accessibilityRole="button"
                hitSlop={spacing.sm}
                style={styles.customLink}
              >
                <Text variant="label" tone="muted" style={styles.link}>
                  {t('quote.customSize')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <ParcelFields form={form} showDims={isParcel && preset === null} />

        <RequestError error={calc.error} />
      </QuoteContent>

      <Sheet
        visible={measureOpen}
        onClose={() => setMeasureOpen(false)}
        title={t('quote.measureTitle')}
        message={t('quote.measureText')}
        closeLabel={t('common.close')}
      >
        <Button title={t('common.ok')} onPress={() => setMeasureOpen(false)} style={styles.flex} />
      </Sheet>
    </Screen>
  );
}

/** Прокрутка с отступом снизу под кнопку и таб-бар. */
function QuoteContent({ children }: { children: ReactNode }) {
  const insets = useScreenInsets();
  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.md }]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.xs },
  title: { marginTop: -spacing.xxs },
  section: { gap: spacing.sm },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  kinds: { flexDirection: 'row', gap: spacing.xs },
  link: { fontSize: 14, textDecorationLine: 'none' },
  customLink: {
    alignSelf: 'flex-start',
    minHeight: sizes.hitTarget - 16,
    justifyContent: 'center',
  },
  footer: { paddingHorizontal: screenPadding, paddingBottom: spacing.xs },
  flex: { flex: 1 },
});
