import { Clock, MapPin, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLocale } from '@/i18n/useLocale';
import { cityLabel, REGIONAL_CITIES, resolveCity, searchCities } from '@/lib/cities';
import { haptics } from '@/lib/haptics';
import { useRecentCities } from './recentCities';
import { Text, fonts, radii, sizes, spacing, useColors } from '@/ui';

export interface CityPickerProps {
  visible: boolean;
  title: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

type Row = { value: string; recent: boolean };

/** Полноэкранный выбор города: поиск по ru/kk, недавние сверху, затем областные центры. */
export function CityPicker({ visible, title, onSelect, onClose }: CityPickerProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const recent = useRecentCities((s) => s.cities);
  const remember = useRecentCities((s) => s.remember);

  const rows = useMemo<Row[]>(() => {
    if (query.trim()) {
      return searchCities(query, locale).map((c) => ({ value: c.value, recent: false }));
    }
    const recentRows = recent
      .filter((v) => resolveCity(v))
      .map((v) => ({ value: v, recent: true }));
    const rest = REGIONAL_CITIES.filter((c) => !recent.includes(c.value)).map((c) => ({
      value: c.value,
      recent: false,
    }));
    return [...recentRows, ...rest];
  }, [query, recent, locale]);

  const choose = (value: string) => {
    haptics.select();
    remember(value);
    setQuery('');
    onSelect(value);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text variant="heading" accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            hitSlop={spacing.xs}
            style={styles.close}
          >
            <X color={colors.icon} size={24} strokeWidth={1.75} />
          </Pressable>
        </View>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <Search color={colors.textMuted} size={20} strokeWidth={1.75} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={t('cityPicker.placeholder')}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            accessibilityLabel={t('cityPicker.placeholder')}
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.input, { color: colors.text }]}
          />
        </View>
        <FlatList
          data={rows}
          keyExtractor={(row) => row.value}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text tone="muted" style={styles.empty}>
              {t('cityPicker.notFound')}
            </Text>
          }
          renderItem={({ item }) => {
            const Icon = item.recent ? Clock : MapPin;
            return (
              <Pressable
                onPress={() => choose(item.value)}
                accessibilityRole="button"
                accessibilityLabel={cityLabel(item.value, locale)}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: colors.line },
                  pressed && { backgroundColor: colors.subtle },
                ]}
              >
                <Icon color={colors.icon} size={20} strokeWidth={1.75} />
                <Text style={styles.rowText}>{cityLabel(item.value, locale)}</Text>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { flex: 1 },
  close: {
    width: sizes.hitTarget,
    height: sizes.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    marginHorizontal: spacing.md,
    minHeight: sizes.buttonHeight,
    borderRadius: radii.button,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, paddingVertical: spacing.sm },
  list: { paddingVertical: spacing.xs },
  row: {
    minHeight: sizes.buttonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1 },
  empty: { textAlign: 'center', padding: spacing.lg },
});
