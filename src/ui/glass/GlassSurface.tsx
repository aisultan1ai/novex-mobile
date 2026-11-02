import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useIsDark } from '../theme';
import { glass, type GlassVariant } from '../tokens';

import { useActiveBlurTarget, useBlurTargetScope, type BlurTargetRef } from './blurTarget';
import { useReduceTransparency } from './useReduceTransparency';

export interface GlassSurfaceProps {
  children?: ReactNode;
  /** auto — светлое или тёмное стекло по теме; onDark — поверх тёмной карты/онбординга. */
  variant?: GlassVariant | 'auto';
  /** Тонкая рамка по краю (по умолчанию есть). */
  bordered?: boolean;
  /** Явная цель размытия для Android; иначе — из окружения (экран или активная вкладка). */
  blurTarget?: BlurTargetRef | null;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

/**
 * Стекло (DESIGN-TZ 1.3, 2.2): BlurView с токенами glass.*. Фолбэк — полупрозрачная заливка, если
 * включено «Уменьшить прозрачность» или на Android нечего размывать (нет BlurTargetView).
 * Скругление задаётся через style.borderRadius — overflow: 'hidden' добавляется здесь.
 */
export function GlassSurface({
  children,
  variant = 'auto',
  bordered = true,
  blurTarget,
  style,
  pointerEvents,
}: GlassSurfaceProps) {
  const isDark = useIsDark();
  const reduceTransparency = useReduceTransparency();
  const scope = useBlurTargetScope();
  const activeTarget = useActiveBlurTarget((s) => s.target);

  const tokens = glass[variant === 'auto' ? (isDark ? 'dark' : 'light') : variant];
  const border = bordered
    ? { borderWidth: StyleSheet.hairlineWidth, borderColor: tokens.border }
    : null;

  const androidTarget =
    blurTarget ?? scope.target ?? (scope.insideTarget ? null : activeTarget) ?? null;
  const canBlur =
    !reduceTransparency && (Platform.OS !== 'android' || (androidTarget && !scope.insideTarget));

  if (!canBlur) {
    return (
      <View
        pointerEvents={pointerEvents}
        style={[styles.clip, { backgroundColor: tokens.fallback }, border, style]}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      pointerEvents={pointerEvents}
      tint={tokens.tint}
      intensity={tokens.intensity}
      blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
      blurTarget={Platform.OS === 'android' ? (androidTarget ?? undefined) : undefined}
      style={[styles.clip, border, style]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
