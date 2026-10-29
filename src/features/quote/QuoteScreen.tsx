import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { FileText, Package } from 'lucide-react-native';
import { useEffect } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { fieldError, onInvalidForm } from '@/lib/forms';
import { haptics } from '@/lib/haptics';
import { useQuoteDraft } from './quoteDraft';
import { Button, RequestError, Screen, Segmented, Text, spacing } from '@/ui';

import { ParcelFields } from './components/ParcelFields';

import { RouteCard } from './components/RouteCard';
import { SizePresets } from './components/SizePresets';
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
 * Главный экран — расчёт стоимости. Доступен гостю: вход понадобится только на «Оформить».
 *
 * Структура:
 *   Screen (футер: «Рассчитать», закреплена внизу)
 *   ├── Заголовок
 *   ├── RouteCard ─ CityField «Откуда» / CityField «Куда» / кнопка «поменять местами»
 *   ├── Segmented ─ Посылка | Документ
 *   ├── SizePresets ─ S / M / L (только посылка)
 *   ├── ParcelFields ─ вес, места, габариты
 *   └── RequestError ─ ошибка запроса (нет сети, лимит, текст бэкенда)
 */
export function QuoteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const saved = useQuoteDraft((s) => s.form);
  const save = useQuoteDraft((s) => s.save);
  const calc = useCalculateQuote();

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

  const [shipmentType, weightKg, widthCm, heightCm, depthCm] = useWatch({
    control,
    name: ['shipmentType', 'weightKg', 'widthCm', 'heightCm', 'depthCm'],
  });
  const preset = matchPreset({ weightKg, widthCm, heightCm, depthCm });

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

  return (
    <Screen
      footer={
        <Button
          title={calc.isPending ? t('quote.calculating') : t('quote.calculate')}
          loading={calc.isPending}
          onPress={() => void submit()}
        />
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="title" accessibilityRole="header">
            {t('quote.title')}
          </Text>
          <Text tone="muted">{t('quote.subtitle')}</Text>
        </View>

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

        <Segmented<ShipmentType>
          accessibilityLabel={t('quote.what')}
          value={shipmentType}
          onChange={(v) => setValue('shipmentType', v, changeOpts())}
          options={[
            { value: 'parcel', label: t('quote.parcel'), icon: Package },
            { value: 'document', label: t('quote.document'), icon: FileText },
          ]}
        />

        {shipmentType === 'parcel' ? (
          <View style={styles.section}>
            <Text variant="label" tone="muted">
              {t('quote.presets')}
            </Text>
            <SizePresets
              value={preset}
              onSelect={(name) => {
                const p = SIZE_PRESETS[name];
                setValue('weightKg', p.weightKg, changeOpts());
                setValue('widthCm', p.widthCm, changeOpts());
                setValue('heightCm', p.heightCm, changeOpts());
                setValue('depthCm', p.depthCm, changeOpts());
              }}
            />
          </View>
        ) : null}

        <ParcelFields form={form} />

        <RequestError error={calc.error} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingVertical: spacing.md },
  header: { gap: spacing.xxs },
  section: { gap: spacing.xs },
});
