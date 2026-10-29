import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './Text';
import { useColors } from './theme';
import { fonts, radii, sizes, spacing } from './tokens';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Текст ошибки уже на языке пользователя. */
  error?: string;
  hint?: string;
  /** Иконка или кнопка справа внутри поля. */
  accessory?: ReactNode;
}

export const TextField = forwardRef<ComponentRef<typeof TextInput>, TextFieldProps>(
  function TextField({ label, error, hint, accessory, onFocus, onBlur, ...input }, ref) {
    const colors = useColors();
    const [focused, setFocused] = useState(false);
    const borderColor = error ? colors.status.danger : focused ? colors.primary : colors.line;

    return (
      <View style={styles.root}>
        <Text variant="label" tone="muted" style={styles.label}>
          {label}
        </Text>
        <View style={[styles.box, { borderColor, backgroundColor: colors.card }]}>
          <TextInput
            ref={ref}
            accessibilityLabel={label}
            accessibilityHint={error ?? hint}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            style={[styles.input, { color: colors.text }]}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...input}
          />
          {accessory}
        </View>
        {error ? (
          <Text
            variant="caption"
            style={[styles.message, { color: colors.status.danger }]}
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        ) : hint ? (
          <Text variant="caption" tone="muted" style={styles.message}>
            {hint}
          </Text>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  label: { marginBottom: spacing.xxs },
  box: {
    minHeight: sizes.buttonHeight,
    borderWidth: 1,
    borderRadius: radii.button,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  message: { marginTop: spacing.xxs },
});
