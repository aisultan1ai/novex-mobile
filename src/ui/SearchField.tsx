import { Search } from 'lucide-react-native';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useColors } from './theme';
import { fonts, radii, spacing } from './tokens';

export interface SearchFieldProps extends Omit<TextInputProps, 'style'> {
  /** Подпись для диктора; на экране — placeholder. */
  label: string;
}

/** Поиск-пилюля: фон subtle, высота 46, лупа слева (DESIGN-TZ 6.10). */
export function SearchField({ label, ...input }: SearchFieldProps) {
  const colors = useColors();
  return (
    <View style={[styles.box, { backgroundColor: colors.subtle }]}>
      <Search color={colors.textMuted} size={20} strokeWidth={1.75} />
      <TextInput
        accessibilityLabel={label}
        accessibilityRole="search"
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={[styles.input, { color: colors.text }]}
        {...input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 46,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 15, paddingVertical: spacing.sm - 2 },
});
