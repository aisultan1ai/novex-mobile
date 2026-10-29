import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { Text, radii, sizes, spacing, useColors } from '@/ui';

import { SIZE_PRESETS, type SizePreset } from '../quoteForm';

export interface SizePresetsProps {
  value: SizePreset | null;
  onSelect: (preset: SizePreset) => void;
}

/** Быстрые размеры S / M / L: одно касание заполняет вес и габариты. */
export function SizePresets({ value, onSelect }: SizePresetsProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('quote.presets')} style={styles.row}>
      {(Object.keys(SIZE_PRESETS) as SizePreset[]).map((name) => {
        const p = SIZE_PRESETS[name];
        const active = value === name;
        const caption = t('quote.presetCaption', {
          weight: p.weightKg,
          dims: `${p.widthCm}×${p.heightCm}×${p.depthCm}`,
        });
        return (
          <Pressable
            key={name}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${name}, ${caption}`}
            onPress={() => {
              haptics.select();
              onSelect(name);
            }}
            style={[
              styles.item,
              {
                backgroundColor: colors.card,
                borderColor: active ? colors.accent : colors.line,
                borderWidth: active ? 2 : 1,
              },
              active && { boxShadow: `0 0 0 3px ${colors.accentGlow}` },
            ]}
          >
            <Text variant="title">{name}</Text>
            <Text variant="caption" tone="muted" style={styles.caption}>
              {caption}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  item: {
    flex: 1,
    minHeight: sizes.buttonHeight + spacing.lg,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  caption: { textAlign: 'center' },
});
