import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { GlassSurface } from './glass/GlassSurface';
import { Text } from './Text';
import { fonts, motion, sizes, spacing } from './tokens';

/** Большой заголовок вкладки (largeTitle 30 pt) с необязательной кнопкой справа. */
export function LargeTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.large}>
      <Text variant="largeTitle" accessibilityRole="header" style={styles.largeText}>
        {title}
      </Text>
      {right}
    </View>
  );
}

/**
 * Сжатие заголовка при прокрутке (DESIGN-TZ 6.10, 7): после порога большой заголовок гаснет,
 * сверху проявляется стеклянная шапка с заголовком 16/600. Возвращает обработчик прокрутки
 * и слой шапки для Screen overlay.
 */
export function useCollapsingTitle(title: string, threshold = 40) {
  const [collapsed, setCollapsed] = useState(false);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = e.nativeEvent.contentOffset.y > threshold;
    if (next !== collapsed) setCollapsed(next);
  };
  return {
    collapsed,
    onScroll,
    scrollEventThrottle: 16,
    overlay: <CollapsedHeader title={title} visible={collapsed} />,
  };
}

export function CollapsedHeader({
  title,
  visible,
  left,
  right,
}: {
  title: string;
  visible: boolean;
  left?: ReactNode;
  right?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    const to = visible ? 1 : 0;
    opacity.set(reduceMotion ? to : withTiming(to, { duration: motion.normal }));
  }, [visible, reduceMotion, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[styles.collapsed, style]}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
    >
      <GlassSurface style={styles.bar} bordered>
        <View style={styles.side}>{left}</View>
        <Text style={styles.small} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  large: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  largeText: { flex: 1 },
  collapsed: { position: 'absolute', top: 0, left: 0, right: 0 },
  bar: {
    minHeight: sizes.hitTarget,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    borderRadius: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  side: { width: sizes.hitTarget, alignItems: 'flex-start' },
  sideRight: { alignItems: 'flex-end' },
  small: { flex: 1, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
});
