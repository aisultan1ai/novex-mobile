import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Text } from './Text';
import { useColors } from './theme';
import { fonts, radii, sizes, spacing } from './tokens';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /**
   * outlined — рамка с подписью «в разрыве рамки» (основные поля);
   * filled — серая плашка: подпись слева, значение справа (вес, места) (DESIGN-TZ 4).
   */
  variant?: 'outlined' | 'filled';
  /** Текст ошибки уже на языке пользователя. */
  error?: string;
  hint?: string;
  /** Иконка или кнопка справа внутри поля. */
  accessory?: ReactNode;
  /** Цвет под подписью outlined-поля — фон, на котором лежит поле (по умолчанию фон экрана). */
  labelBackground?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextField = forwardRef<ComponentRef<typeof TextInput>, TextFieldProps>(
  function TextField(
    {
      label,
      variant = 'outlined',
      error,
      hint,
      accessory,
      labelBackground,
      containerStyle,
      onFocus,
      onBlur,
      ...input
    },
    ref,
  ) {
    const colors = useColors();
    const [focused, setFocused] = useState(false);

    const handlers = {
      onFocus: (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
        setFocused(true);
        onFocus?.(e);
      },
      onBlur: (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
        setFocused(false);
        onBlur?.(e);
      },
    };

    const message = error ? (
      <Text
        variant="caption"
        style={[styles.message, { color: colors.danger }]}
        accessibilityLiveRegion="polite"
      >
        {error}
      </Text>
    ) : hint ? (
      <Text variant="caption" tone="muted" style={styles.message}>
        {hint}
      </Text>
    ) : null;

    if (variant === 'filled') {
      return (
        <View style={[styles.root, containerStyle]}>
          <View
            style={[
              styles.filled,
              { backgroundColor: colors.subtle },
              (focused || error) && {
                borderWidth: 1.5,
                borderColor: error ? colors.danger : colors.accent,
              },
            ]}
          >
            <Text variant="label" tone="muted" numberOfLines={2} style={styles.filledLabel}>
              {label}
            </Text>
            <TextInput
              ref={ref}
              accessibilityLabel={label}
              accessibilityHint={error ?? hint}
              placeholderTextColor={colors.textSubtle}
              selectionColor={colors.accent}
              style={[styles.filledInput, { color: colors.text }]}
              {...handlers}
              {...input}
            />
          </View>
          {message}
        </View>
      );
    }

    const idle = Platform.OS === 'android' ? colors.lineStrong : colors.line;
    const borderColor = error ? colors.danger : focused ? colors.accent : idle;

    return (
      <View style={[styles.root, containerStyle]}>
        <View style={[styles.outlined, { borderColor, borderWidth: focused || error ? 1.5 : 1 }]}>
          <TextInput
            ref={ref}
            accessibilityLabel={label}
            accessibilityHint={error ?? hint}
            placeholderTextColor={colors.textSubtle}
            selectionColor={colors.accent}
            style={[styles.outlinedInput, { color: colors.text }]}
            {...handlers}
            {...input}
          />
          {accessory}
          <View
            pointerEvents="none"
            style={[styles.notch, { backgroundColor: labelBackground ?? colors.background }]}
          >
            <Text
              variant="caption"
              numberOfLines={1}
              style={{
                color: focused ? colors.text : colors.textMuted,
                fontFamily: focused ? fonts.semibold : fonts.regular,
              }}
            >
              {label}
            </Text>
          </View>
        </View>
        {message}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  outlined: {
    minHeight: sizes.inputHeight,
    borderRadius: radii.input,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.xxs,
    marginTop: spacing.xs,
  },
  outlinedInput: {
    flex: 1,
    minHeight: sizes.hitTarget,
    fontFamily: fonts.medium,
    fontSize: 16,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
  },
  /** Подпись «в разрыве рамки»: плашка цвета фона поверх верхней границы. */
  notch: {
    position: 'absolute',
    left: spacing.sm,
    top: -9,
    paddingHorizontal: spacing.xxs,
    maxWidth: '85%',
  },
  filled: {
    minHeight: 52,
    borderRadius: radii.tile,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filledLabel: { flexShrink: 1 },
  filledInput: {
    flex: 1,
    minWidth: 48,
    minHeight: sizes.hitTarget,
    textAlign: 'right',
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  message: { marginTop: spacing.xxs },
});
