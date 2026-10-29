import { Tabs } from 'expo-router';
import {
  Bell,
  Calculator,
  Package,
  ScanSearch,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { Text, fonts, sizes, useColors } from '@/ui';

export default function TabLayout() {
  const { t } = useTranslation();
  const colors = useColors();
  const asString = (color: ColorValue) => (typeof color === 'string' ? color : colors.textMuted);

  const tab = (title: string, Icon: LucideIcon) => ({
    title,
    tabBarAccessibilityLabel: title,
    tabBarIcon: ({ color }: { color: ColorValue }) => (
      <Icon color={asString(color)} size={sizes.tabIcon} strokeWidth={1.75} />
    ),
    // Казахские подписи длиннее — уменьшаем шрифт, а не обрезаем текст (ТЗ 6.2).
    tabBarLabel: ({ color }: { color: ColorValue }) => (
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={{ color, fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 }}
      >
        {title}
      </Text>
    ),
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen name="index" options={tab(t('tabs.quote'), Calculator)} />
      <Tabs.Screen name="orders" options={tab(t('tabs.orders'), Package)} />
      <Tabs.Screen name="track" options={tab(t('tabs.track'), ScanSearch)} />
      <Tabs.Screen name="notifications" options={tab(t('tabs.notifications'), Bell)} />
      <Tabs.Screen name="profile" options={tab(t('tabs.profile'), UserRound)} />
    </Tabs>
  );
}
