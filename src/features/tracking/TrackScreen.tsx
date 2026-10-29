import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { fieldError, onInvalidForm } from '@/lib/forms';
import { useLocale } from '@/i18n/useLocale';
import { cityLabel } from '@/lib/cities';
import { Button, Screen, Text, TextField, radii, sizes, spacing, useColors } from '@/ui';
import { STATUS_ICONS, toneColor } from '@/ui/statusIcons';

import { useTrackedShipments } from './trackedShipments';
import { normalizeTrackingNumber } from './usePublicTracking';

const schema = z.object({
  number: z
    .string()
    .transform(normalizeTrackingNumber)
    .pipe(z.string().min(4, 'tracking.errors.empty').max(64, 'tracking.errors.empty')),
});

/**
 * Вкладка «Отследить» (без входа).
 *   Screen (футер: «Отследить»)
 *   ├── заголовок
 *   ├── поле трек-номера
 *   └── недавние отправления: статус иконкой и цветом, маршрут — без сети тоже видны
 * Скан штрихкода (expo-camera) — следующий шаг.
 */
export function TrackScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const locale = useLocale();
  const recent = useTrackedShipments((s) => s.recent);
  const byNumber = useTrackedShipments((s) => s.byNumber);

  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { number: '' },
  });

  const open = (number: string) =>
    router.push({ pathname: '/tracking/[number]', params: { number } });

  const submit = form.handleSubmit(({ number }) => open(number), onInvalidForm);

  return (
    <Screen footer={<Button title={t('tabs.track')} onPress={() => void submit()} />}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text variant="title" accessibilityRole="header">
            {t('tracking.title')}
          </Text>
          <Text tone="muted">{t('tracking.subtitle')}</Text>
        </View>

        <Controller
          control={form.control}
          name="number"
          render={({ field, fieldState }) => (
            <TextField
              ref={field.ref}
              label={t('tracking.numberLabel')}
              placeholder={t('tracking.numberPlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError(t, fieldState.error)}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => void submit()}
            />
          )}
        />

        {recent.length > 0 ? (
          <View style={styles.recent}>
            <Text variant="label" tone="muted">
              {t('tracking.recent')}
            </Text>
            {recent.map((number) => {
              const item = byNumber[number];
              if (!item) return null;
              const Icon = STATUS_ICONS[item.group];
              const label = t(`statusGroup.${item.group}`);
              const route = `${cityLabel(item.fromCity, locale)} → ${cityLabel(item.toCity, locale)}`;
              return (
                <Pressable
                  key={number}
                  onPress={() => open(number)}
                  accessibilityRole="button"
                  accessibilityLabel={`${number}, ${label}, ${route}`}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: colors.card, borderColor: colors.line },
                    pressed && { backgroundColor: colors.subtle },
                  ]}
                >
                  <Icon color={toneColor(colors, item.tone)} size={22} strokeWidth={1.75} />
                  <View style={styles.rowText}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {label}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {number} · {route}
                    </Text>
                  </View>
                  <ChevronRight color={colors.textMuted} size={20} strokeWidth={1.75} />
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text tone="muted">{t('tracking.hint')}</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingVertical: spacing.md },
  header: { gap: spacing.xxs },
  recent: { gap: spacing.xs },
  row: {
    minHeight: sizes.buttonHeight + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  rowText: { flex: 1, gap: 2 },
});
