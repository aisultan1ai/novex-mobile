import { Redirect, Tabs } from 'expo-router';
import { Bell, Calculator, LocateFixed, Package, UserRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useHasUnread } from '@/features/notifications/useNotifications';
import { useSettingsHydrated, useSettingsStore } from '@/store/settings';
import { TabBar, type TabBarItem } from '@/ui/TabBar';

/** Нижняя навигация v2: только иконки, подписи — для экранного диктора (DESIGN-TZ 4, TabBar). */
export default function TabLayout() {
  const { t } = useTranslation();
  const hasUnread = useHasUnread();
  const hydrated = useSettingsHydrated();
  const onboardingSeen = useSettingsStore((s) => s.onboardingSeen);

  const items: Record<string, TabBarItem> = {
    index: { icon: Calculator, label: t('tabs.quote') },
    orders: { icon: Package, label: t('tabs.orders') },
    track: { icon: LocateFixed, label: t('tabs.track') },
    notifications: {
      icon: Bell,
      label: hasUnread ? t('tabs.notificationsUnread') : t('tabs.notifications'),
      dot: hasUnread,
    },
    profile: { icon: UserRound, label: t('tabs.profile') },
  };

  // Первый запуск — онбординг; решаем только после чтения настроек из хранилища.
  if (hydrated && !onboardingSeen) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} items={items} />}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.quote') }} />
      <Tabs.Screen name="orders" options={{ title: t('tabs.orders') }} />
      <Tabs.Screen name="track" options={{ title: t('tabs.track') }} />
      <Tabs.Screen name="notifications" options={{ title: t('tabs.notifications') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
