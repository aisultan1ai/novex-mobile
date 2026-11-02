import type { ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from './glass/GlassSurface';
import { Text } from './Text';
import { useColors } from './theme';
import { glass, motion, radii, spacing } from './tokens';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Пояснение под заголовком (что произойдёт). */
  message?: ReactNode;
  /** Кнопки действия (обычно две в ряд) и прочее содержимое. */
  children?: ReactNode;
  /** Подпись затемнения для диктора («Закрыть»). */
  closeLabel: string;
}

/**
 * Нижний лист для подтверждений (DESIGN-TZ 4): iOS — «парящая» стеклянная карточка с отступами,
 * Android — от края до края со скруглением сверху. Выезд снизу + затемнение, 300 мс.
 */
export function Sheet({ visible, onClose, title, message, children, closeLabel }: SheetProps) {
  const colors = useColors();
  const safe = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const android = Platform.OS === 'android';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(motion.normal)}
          exiting={reduceMotion ? undefined : FadeOut.duration(motion.fast)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={onClose}
            style={[StyleSheet.absoluteFill, { backgroundColor: glass.scrim }]}
          />
        </Animated.View>

        <Animated.View
          entering={reduceMotion ? undefined : SlideInDown.duration(motion.sheet)}
          exiting={reduceMotion ? undefined : SlideOutDown.duration(motion.normal)}
          accessibilityViewIsModal
          style={
            android
              ? styles.edge
              : [styles.floating, { bottom: Math.max(safe.bottom - 6, spacing.sm) }]
          }
        >
          <GlassSurface
            style={[
              styles.card,
              android
                ? {
                    borderTopLeftRadius: radii.sheet,
                    borderTopRightRadius: radii.sheet,
                    paddingBottom: safe.bottom + spacing.md,
                    backgroundColor: colors.card,
                  }
                : { borderRadius: radii.sheet },
            ]}
          >
            <View accessibilityRole="alert">
              <Text variant="title" style={styles.center}>
                {title}
              </Text>
              {message ? (
                <Text variant="label" tone="muted" style={[styles.center, styles.message]}>
                  {message}
                </Text>
              ) : null}
            </View>
            {children ? <View style={styles.actions}>{children}</View> : null}
          </GlassSurface>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  floating: { position: 'absolute', left: 10, right: 10 },
  edge: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  card: { paddingTop: 26, paddingHorizontal: 18, paddingBottom: 18 },
  center: { textAlign: 'center' },
  message: { marginTop: spacing.xs, fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: 20 },
});
