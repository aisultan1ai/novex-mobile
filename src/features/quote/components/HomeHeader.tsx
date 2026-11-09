import { useRouter } from 'expo-router';
import { Bell, UserRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useHasUnread } from '@/features/notifications/useNotifications';
import { firstName, initials, useProfile } from '@/features/profile/useProfile';
import { partOfDay } from '@/lib/format';
import { Text, fonts, sizes, spacing, useColors } from '@/ui';

/**
 * Шапка главного экрана (DESIGN-TZ 6.3): аватар на тёплой подложке, приветствие по времени суток
 * («Доброе утро, Айгерим»), колокольчик с красной точкой при непрочитанных.
 * Гость — без имени, вместо инициалов — силуэт; аватар ведёт в профиль.
 */
export function HomeHeader() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const profile = useProfile().data;
  const hasUnread = useHasUnread();
  const name = firstName(profile?.full_name);
  const letters = initials(profile?.full_name, profile?.email);
  const android = Platform.OS === 'android';

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.push('/profile')}
        accessibilityRole="button"
        accessibilityLabel={t('tabs.profile')}
        style={[styles.avatar, { backgroundColor: colors.warmTint }]}
      >
        {letters ? (
          <Text style={[styles.avatarText, { color: colors.strong }]}>{letters}</Text>
        ) : (
          <UserRound color={colors.strong} size={20} strokeWidth={1.75} />
        )}
      </Pressable>
      <Text style={[styles.greeting, { color: colors.textMuted }]} numberOfLines={1}>
        {t(`home.${partOfDay()}`)}
        {name ? (
          <>
            {', '}
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          </>
        ) : null}
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
    width: sizes.hitTarget,
    height: sizes.hitTarget,
    borderRadius: sizes.hitTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 15 },
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
