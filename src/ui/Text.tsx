import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useColors } from './theme';
import { typography, type TypographyVariant } from './tokens';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  tone?: 'default' | 'muted';
}

// Системный размер шрифта учитывается (allowFontScaling по умолчанию), вёрстка должна это выдерживать.
export function Text({ variant = 'body', tone = 'default', style, ...rest }: TextProps) {
  const colors = useColors();
  return (
    <RNText
      style={[
        typography[variant],
        { color: tone === 'muted' ? colors.textMuted : colors.text },
        style,
      ]}
      {...rest}
    />
  );
}
