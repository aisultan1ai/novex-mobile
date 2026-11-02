import type { BottomTabBarProps } from 'expo-router/tabs';
import type { LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';

import { GlassSurface } from './glass/GlassSurface';
import { TAB_BAR_FLOAT_GAP } from './tabBarInset';
import { useColors } from './theme';
import { shadows, sizes } from './tokens';

export interface TabBarItem {
  icon: LucideIcon;
  /** Подпись для экранного диктора — на экране подписей нет (DESIGN-TZ 1.5). */
  label: string;
  /** Cyan-точка 7 pt (непрочитанные уведомления). */
  dot?: boolean;
}

export interface TabBarProps extends BottomTabBarProps {
  items: Record<string, TabBarItem>;
}

/**
 * Таб-бар только с иконками (DESIGN-TZ 4, 8). iOS — плавающая стеклянная капсула, активная вкладка —
 * navy-круг 48 с белой иконкой. Android — стеклянная панель на всю ширину 72 pt с индикатором-пилюлей.
 * Лежит поверх экранов (position: absolute): экраны дают снизу отступ useTabBarInset().
 */
export function TabBar({ state, emitter, navigateToTab, insets, items }: TabBarProps) {
  const android = Platform.OS === 'android';

  const tabs = state.routes.map((route, index) => {
    const item = items[route.name];
    if (!item) return null;
    const focused = index === state.index;
    const onPress = () => {
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        haptics.select();
        navigateToTab(route.key);
      }
    };
    const onLongPress = () => emitter.emit({ type: 'tabLongPress', target: route.key });
    return (
      <TabButton
        key={route.key}
        item={item}
        focused={focused}
        android={android}
        position={index + 1}
        count={state.routes.length}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    );
  });

  if (android) {
    return (
      <View style={[styles.androidWrap, { height: sizes.navBarAndroid + insets.bottom }]}>
        <GlassSurface style={[styles.androidBar, { paddingBottom: insets.bottom }]}>
          <View style={styles.androidRow} accessibilityRole="tablist">
            {tabs}
          </View>
        </GlassSurface>
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.iosWrap, { bottom: insets.bottom + TAB_BAR_FLOAT_GAP }]}
    >
      <View style={styles.iosShadow}>
        <GlassSurface style={styles.iosBar}>
          <View style={styles.iosRow} accessibilityRole="tablist">
            {tabs}
          </View>
        </GlassSurface>
      </View>
    </View>
  );
}

function TabButton({
  item,
  focused,
  android,
  position,
  count,
  onPress,
  onLongPress,
}: {
  item: TabBarItem;
  focused: boolean;
  android: boolean;
  position: number;
  count: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const colors = useColors();
  const Icon = item.icon;
  const iconColor = focused ? (android ? colors.text : colors.onNavy) : colors.iconInactive;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={item.label}
      accessibilityValue={{ text: `${position} / ${count}` }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.button}
    >
      <View
        style={[
          android ? styles.androidIndicator : styles.iosCircle,
          focused && {
            backgroundColor: android ? colors.accentTintStrong : colors.navy,
          },
        ]}
      >
        <Icon
          color={iconColor}
          size={sizes.tabIcon}
          strokeWidth={focused && android ? 1.9 : 1.75}
        />
        {item.dot ? (
          <View
            style={[
              styles.dot,
              android ? styles.dotAndroid : styles.dotIos,
              { backgroundColor: colors.accent },
            ]}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iosWrap: { position: 'absolute', left: 28, right: 28 },
  iosShadow: { borderRadius: sizes.navBar / 2, boxShadow: shadows.floating },
  iosBar: { height: sizes.navBar, borderRadius: sizes.navBar / 2 },
  iosRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  iosCircle: {
    width: sizes.navItem,
    height: sizes.navItem,
    borderRadius: sizes.navItem / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  androidBar: {
    flex: 1,
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  androidRow: {
    height: sizes.navBarAndroid,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  androidIndicator: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    minWidth: sizes.hitTarget,
    minHeight: sizes.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { position: 'absolute', width: 7, height: 7, borderRadius: 3.5 },
  dotIos: { top: 12, right: 13 },
  dotAndroid: { top: 2, right: 18 },
});
