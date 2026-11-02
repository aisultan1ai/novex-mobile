import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useHasUnread } from '@/features/notifications/useNotifications';
import { firstName, initials, useProfile } from '@/features/profile/useProfile';
import { Text, fonts, sizes, spacing, useColors } from '@/ui';

/**
 * Шапка главного экрана (DESIGN-TZ 6.3): аватар-инициалы, «Привет, {имя}», колокольчик с красной
 * точкой при непрочитанных. Гость — без имени, аватар-пустышка.
 */
export function HomeHeader() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const profile = useProfile().data;
  const hasUnread = useHasUnread();
  const name = firstName(profile?.full_name);
  const android = Platform.OS === 'android';

  return (
    <View style={styles.row}>
      <View
        style={[styles.avatar, { backgroundColor: colors.navy }]}
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={[styles.avatarText, { color: colors.onNavy }]}>
          {initials(profile?.full_name, profile?.email) || 'N'}
        </Text>
      </View>
      <Text style={[styles.greeting, { color: colors.textMuted }]} numberOfLines={1}>
        {name ? (
          <>
            {t('home.greetingPrefix')}
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            {t('home.greetingSuffix')}
          </>
        ) : (
          t('home.greetingGuest')
        )}
      </Text>
      <Pressable
        onPress={() => router.push('/notifications')}
        accessibilityRole="button"
        accessibilityLabel={hasUnread ? t('tabs.notificationsUnread') : t('tabs.notifications')}
        style={[styles.bell, !android && { backgroundColor: colors.subtle }]}
      >
        <Bell color={colors.text} size={22} strokeWidth={1.75} />
        {hasUnread ? (
          <View
            style={[
              styles.dot,
              {
                backgroundColor: colors.status.danger,
                borderColor: android ? colors.background : colors.subtle,
              },
            ]}
          />
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 14 },
  greeting: { flex: 1, fontFamily: fonts.medium, fontSize: 16 },
  name: { fontFamily: fonts.semibold },
  bell: {
    width: sizes.hitTarget,
    height: sizes.hitTarget,
    borderRadius: sizes.hitTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
