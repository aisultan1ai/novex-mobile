import { ChevronDown, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useLocale } from '@/i18n/useLocale';
import { cityLabel } from '@/lib/cities';
import { Text, radii, sizes, spacing, useColors } from '@/ui';

import { CityPicker } from './CityPicker';

export interface CityFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  icon?: LucideIcon;
  /** Без рамки — для полей внутри общей карточки маршрута. */
  bare?: boolean;
}

/** Поле-кнопка «город»: показывает название на языке интерфейса, хранит русское value для API. */
export function CityField({
  label,
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  bare = false,
}: CityFieldProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const display = value ? cityLabel(value, locale) : '';

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display || placeholder}`}
        accessibilityHint={error}
        style={[
          styles.field,
          !bare && [styles.boxed, { backgroundColor: colors.card }],
          !bare && { borderColor: error ? colors.status.danger : colors.line },
        ]}
      >
        {Icon ? <Icon color={colors.icon} size={20} strokeWidth={1.75} /> : null}
        <View style={styles.texts}>
          <Text variant="caption" tone="muted">
            {label}
          </Text>
          <Text variant="bodyStrong" tone={display ? 'default' : 'muted'} numberOfLines={1}>
            {display || placeholder}
          </Text>
        </View>
        <ChevronDown color={colors.textMuted} size={20} strokeWidth={1.75} />
      </Pressable>
      {error ? (
        <Text variant="caption" style={[styles.error, { color: colors.status.danger }]}>
          {error}
        </Text>
      ) : null}
      <CityPicker
        visible={open}
        title={label}
        onClose={() => setOpen(false)}
        onSelect={(v) => {
          onChange(v);
          setOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: sizes.buttonHeight + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  boxed: { borderWidth: 1, borderRadius: radii.button, paddingHorizontal: spacing.sm },
  texts: { flex: 1, gap: 2 },
  error: { marginTop: spacing.xxs },
});
