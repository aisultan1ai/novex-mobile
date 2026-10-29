import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useColors } from './theme';
import { spacing } from './tokens';

export interface ScreenProps {
  children: ReactNode;
  /** Нижняя закреплённая кнопка — главное действие экрана (ТЗ 6.5). */
  footer?: ReactNode;
  edges?: Edge[];
  contentStyle?: ViewStyle;
}

export function Screen({ children, footer, edges = ['top'], contentStyle }: ScreenProps) {
  const colors = useColors();
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.md },
  footer: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
