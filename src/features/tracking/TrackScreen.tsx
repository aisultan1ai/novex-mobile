import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ChevronRight, ScanBarcode } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { useLocale } from '@/i18n/useLocale';
import { cityLabel } from '@/lib/cities';
import { formatDate } from '@/lib/format';
import { fieldError, onInvalidForm } from '@/lib/forms';
import {
  Button,
  Screen,
  Sheet,
  StatusDot,
  Text,
  TextField,
  fonts,
  radii,
  screenPadding,
  spacing,
  useColors,
  useScreenInsets,
} from '@/ui';
import { SearchParcelIllustration } from '@/ui/illustrations';

import type { ShipmentLiveState } from './liveState';
import { useTrackedShipments } from './trackedShipments';
import { normalizeTrackingNumber } from './usePublicTracking';

const schema = z.object({
  number: z
    .string()
    .transform(normalizeTrackingNumber)
    .pipe(z.string().min(4, 'tracking.errors.empty').max(64, 'tracking.errors.empty')),
});

/**
 * Вкладка «Отследить» (DESIGN-TZ 6.9), без входа.
 *   иллюстрация · «Где моя посылка?» · поле трек-номера + кнопка сканера · подсказка
 *   «Недавние» — строки 64 pt: номер, статус точкой и текстом (без сети тоже видны)
 *   футер: «Отследить» над таб-баром
 */
export function TrackScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const recent = useTrackedShipments((s) => s.recent);
  const byNumber = useTrackedShipments((s) => s.byNumber);
  const [scanInfo, setScanInfo] = useState(false);

  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { number: '' },
  });

  const open = (number: string) =>
    router.push({ pathname: '/tracking/[number]', params: { number } });
  const submit = form.handleSubmit(({ number }) => open(number), onInvalidForm);

  return (
    <Screen
      withTabBar
      footer={
        <View style={styles.footer}>
          <Button title={t('tabs.track')} onPress={() => void submit()} />
        </View>
      }
    >
      <TrackContent>
        <View style={styles.illustration}>
          <SearchParcelIllustration />
        </View>
        <Text variant="largeTitle" accessibilityRole="header" style={styles.center}>
          {t('tracking.title')}
        </Text>
        <Text tone="muted" style={[styles.center, styles.subtitle]}>
          {t('tracking.subtitle')}
        </Text>

        <View style={styles.inputRow}>
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
                hint={fieldState.error ? undefined : t('tracking.hint')}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => void submit()}
              />
            )}
          />
          <Pressable
            onPress={() => setScanInfo(true)}
            accessibilityRole="button"
            accessibilityLabel={t('tracking.scan')}
            style={({ pressed }) => [
              styles.scan,
              { backgroundColor: colors.navy },
              pressed && styles.pressed,
            ]}
          >
            <ScanBarcode color={colors.onNavy} size={24} strokeWidth={1.75} />
          </Pressable>
        </View>

        {recent.length > 0 ? (
          <View>
            <Text variant="section" accessibilityRole="header" style={styles.recentTitle}>
              {t('tracking.recent')}
            </Text>
            {recent.map((number) => {
              const item = byNumber[number];
              return item ? (
                <RecentRow key={number} number={number} item={item} onPress={() => open(number)} />
              ) : null;
            })}
          </View>
        ) : null}
      </TrackContent>

      <Sheet
        visible={scanInfo}
        onClose={() => setScanInfo(false)}
        title={t('tracking.scanSoonTitle')}
        message={t('tracking.scanSoonText')}
        closeLabel={t('common.close')}
      >
        <Button title={t('common.ok')} onPress={() => setScanInfo(false)} style={styles.flex} />
      </Sheet>
    </Screen>
  );
}

function RecentRow({
  number,
  item,
  onPress,
}: {
  number: string;
  item: ShipmentLiveState;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const locale = useLocale();
  // «Жолда · Балқаш» — где посылка сейчас; доставленная — дата вручения.
  const meta = item.deliveredAt
    ? formatDate(item.deliveredAt, locale)
    : item.lastEvent?.location
      ? cityLabel(item.lastEvent.location, locale)
      : cityLabel(item.toCity, locale);
  const label = t(`statusGroup.${item.group}`);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${number}, ${label}, ${meta}`}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.line },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.rowText} importantForAccessibility="no-hide-descendants">
        <Text style={styles.number} numberOfLines={1}>
          {number}
        </Text>
        <StatusDot status={item.status} label={label} meta={meta} size={7} />
      </View>
      <ChevronRight color={colors.text} size={20} strokeWidth={1.75} />
    </Pressable>
  );
}

function TrackContent({ children }: { children: ReactNode }) {
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

const SCAN = 56;

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xl },
  illustration: { alignItems: 'center' },
  center: { textAlign: 'center' },
  subtitle: { marginTop: spacing.xs, fontSize: 15, lineHeight: 22 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  scan: {
    width: SCAN,
    height: SCAN,
    borderRadius: radii.tile,
    marginTop: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  recentTitle: { marginTop: 22, fontSize: 17 },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  rowText: { flex: 1, gap: 2, paddingVertical: spacing.xs },
  number: { fontFamily: fonts.semibold, fontSize: 16, letterSpacing: 0.32 },
  footer: { paddingHorizontal: screenPadding, paddingBottom: spacing.xs },
  flex: { flex: 1 },
});
