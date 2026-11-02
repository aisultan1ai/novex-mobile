import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { SelectableCard, Text, fonts, spacing } from '@/ui';
import { IsoBox } from '@/ui/illustrations';

import { SIZE_PRESETS, type SizePreset } from '../quoteForm';

const ANDROID = Platform.OS === 'android';

// Размер коробки на иллюстрации — из макета iOS-Home.
const BOX: Record<SizePreset, { w: number; h: number }> = {
  S: { w: 22, h: 16 },
  M: { w: 30, h: 22 },
  L: { w: 38, h: 29 },
};

export interface SizePresetsProps {
  value: SizePreset | null;
  onSelect: (preset: SizePreset) => void;
}

/**
 * Размеры S / M / L (DESIGN-TZ 6.3): карточки выбора 100 pt с изометрической коробкой
 * (верхняя грань cyan у выбранной). Android — 64 pt, радиус 12, без иллюстрации.
 */
export function SizePresets({ value, onSelect }: SizePresetsProps) {
  const { t } = useTranslation();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('quote.size')} style={styles.row}>
      {(Object.keys(SIZE_PRESETS) as SizePreset[]).map((name) => {
        const selected = value === name;
        const caption = t('quote.presetLimit', { kg: SIZE_PRESETS[name].limitKg });
        return (
          <SelectableCard
            key={name}
            selected={selected}
            radius={ANDROID ? 12 : 18}
            checkSize={20}
            accessibilityLabel={`${name}, ${caption}`}
            onPress={() => {
              if (selected) return;
              haptics.select();
              onSelect(name);
            }}
            style={[styles.card, ANDROID ? styles.cardAndroid : styles.cardIos]}
          >
            {ANDROID ? null : <IsoBox w={BOX[name].w} h={BOX[name].h} selected={selected} />}
            <View>
              <Text style={styles.name}>{name}</Text>
              <Text variant="caption" tone="muted" numberOfLines={2}>
                {caption}
              </Text>
            </View>
          </SelectableCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  card: { flex: 1, padding: spacing.sm },
  cardIos: { minHeight: 100, justifyContent: 'space-between' },
  cardAndroid: { minHeight: 64, justifyContent: 'center' },
  name: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 20 },
});
