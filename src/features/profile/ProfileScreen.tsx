import { useRouter } from 'expo-router';
import {
  BookUser,
  FileText,
  Globe,
  LogOut,
  Moon,
  MonitorSmartphone,
  UserRound,
} from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { logout, updateLocale } from '@/api/endpoints/auth';
import type { Locale } from '@/api/client';
import { useOrders } from '@/features/orders/useOrders';
import { formatMoney } from '@/lib/format';
import { useSessionStore } from '@/store/session';
import { useSettingsStore } from '@/store/settings';
import {
  Button,
  LargeTitle,
  ListGroup,
  ListRow,
  Screen,
  Sheet,
  StatTile,
  Switch,
  Text,
  fonts,
  spacing,
  useCollapsingTitle,
  useColors,
  useIsDark,
  useScreenInsets,
} from '@/ui';

import { initials, useAddressBook, useContract, useProfile } from './useProfile';

const LANGUAGE_NAMES: Record<Locale, string> = { ru: 'Русский', kk: 'Қазақша' };

/** Ответ /contracts/me в схеме не описан — читаем только нужные поля. */
function parseContract(data: unknown) {
  if (!data || typeof data !== 'object') return null;
  const d = data as {
    contract?: { contract_number?: string; status?: string } | null;
    debt?: string;
  };
  return {
    number: d.contract?.contract_number ?? null,
    status: d.contract?.status ?? null,
    debt: d.debt ?? '0',
  };
}

/**
 * Профиль (DESIGN-TZ 6.12).
 *   largeTitle · аватар 56 + имя + «компания · email»
 *   договорным клиентам — плитки «К оплате по акту» и «Отправлений в месяце»
 *   ListGroup: Личные данные · Адресная книга · Договор и акты
 *   ListGroup: Тёмная тема · Как в системе · Язык · Выйти (лист подтверждения)
 * Гостю — приглашение войти и настройки.
 */
export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();
  const signedIn = useSessionStore((s) => s.status === 'signedIn');
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const header = useCollapsingTitle(t('tabs.profile'));
  const [sheet, setSheet] = useState<'logout' | 'language' | null>(null);

  const profile = useProfile().data;
  const isCompany = profile?.customer_type === 'company' || profile?.billing_mode === 'postpaid';
  const contract = parseContract(useContract(signedIn && isCompany).data);
  const addresses = useAddressBook(signedIn).data;
  const orders = useOrders().data?.items;
  const sentThisMonth = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    return (orders ?? []).filter((o) => o.created_at.startsWith(month)).length;
  }, [orders]);

  const locale: Locale = i18n.language === 'kk' ? 'kk' : 'ru';
  const chooseLanguage = (next: Locale) => {
    setSheet(null);
    setLocale(next);
    // Письма и push — на том же языке (ТЗ 5.3). Ошибка сети не мешает смене языка в приложении.
    if (signedIn) updateLocale(next).catch(() => undefined);
  };

  return (
    <Screen withTabBar overlay={header.overlay}>
      <ProfileScroll onScroll={header.onScroll}>
        <LargeTitle title={t('tabs.profile')} />

        {signedIn && profile ? (
          <View style={styles.person}>
            <View style={[styles.avatar, { backgroundColor: colors.navy }]}>
              <Text style={[styles.avatarText, { color: colors.onNavy }]}>
                {initials(profile.full_name, profile.email)}
              </Text>
            </View>
            <View style={styles.personText}>
              <Text style={styles.name} numberOfLines={2}>
                {profile.full_name || profile.email}
              </Text>
              <Text variant="label" tone="muted" numberOfLines={1} style={styles.company}>
                {[profile.company_name, profile.email].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        ) : !signedIn ? (
          <View style={[styles.guest, { backgroundColor: colors.subtle }]}>
            <Text variant="section">{t('profile.guestTitle')}</Text>
            <Text variant="label" tone="muted" style={styles.guestText}>
              {t('profile.guestText')}
            </Text>
            <Button title={t('auth.signIn')} onPress={() => router.push('/sign-in')} />
          </View>
        ) : null}

        {signedIn && isCompany && contract ? (
          <View style={styles.tiles}>
            <StatTile
              size="large"
              align="left"
              tone="navy"
              label={t('profile.debt')}
              value={formatMoney(contract.debt)}
            />
            <StatTile
              size="large"
              align="left"
              label={t('profile.sentThisMonth')}
              value={String(sentThisMonth)}
            />
          </View>
        ) : null}

        {signedIn && profile ? (
          <ListGroup>
            <ListRow
              icon={UserRound}
              title={t('profile.personal')}
              value={profile.phone ?? undefined}
            />
            <ListRow
              icon={BookUser}
              title={t('profile.addressBook')}
              value={addresses ? String(addresses.length) : undefined}
            />
            {isCompany ? (
              <ListRow
                icon={FileText}
                title={t('profile.contract')}
                value={contract?.number ?? t('profile.noContract')}
              />
            ) : null}
          </ListGroup>
        ) : null}

        <ListGroup>
          <ListRow
            icon={Moon}
            title={t('profile.darkTheme')}
            right={
              <Switch
                accessibilityLabel={t('profile.darkTheme')}
                value={isDark}
                disabled={theme === 'system'}
                onValueChange={(on) => setTheme(on ? 'dark' : 'light')}
              />
            }
          />
          <ListRow
            icon={MonitorSmartphone}
            title={t('profile.systemTheme')}
            right={
              <Switch
                accessibilityLabel={t('profile.systemTheme')}
                value={theme === 'system'}
                onValueChange={(on) => setTheme(on ? 'system' : isDark ? 'dark' : 'light')}
              />
            }
          />
          <ListRow
            icon={Globe}
            title={t('profile.language')}
            value={LANGUAGE_NAMES[locale]}
            onPress={() => setSheet('language')}
          />
          {signedIn ? (
            <ListRow
              icon={LogOut}
              title={t('profile.logout')}
              destructive
              onPress={() => setSheet('logout')}
            />
          ) : null}
        </ListGroup>
      </ProfileScroll>

      <Sheet
        visible={sheet === 'logout'}
        onClose={() => setSheet(null)}
        title={t('profile.logoutTitle')}
        message={t('profile.logoutText', { email: profile?.email ?? '' })}
        closeLabel={t('common.close')}
      >
        <Button
          variant="destructive"
          title={t('profile.logout')}
          style={styles.flex}
          onPress={() => {
            setSheet(null);
            void logout();
          }}
        />
        <Button title={t('profile.stay')} style={styles.flex} onPress={() => setSheet(null)} />
      </Sheet>

      <Sheet
        visible={sheet === 'language'}
        onClose={() => setSheet(null)}
        title={t('profile.language')}
        closeLabel={t('common.close')}
      >
        {(Object.keys(LANGUAGE_NAMES) as Locale[]).map((l) => (
          <Button
            key={l}
            variant={l === locale ? 'primary' : 'secondary'}
            title={LANGUAGE_NAMES[l]}
            style={styles.flex}
            onPress={() => chooseLanguage(l)}
          />
        ))}
      </Sheet>
    </Screen>
  );
}

function ProfileScroll({
  children,
  onScroll,
}: {
  children: ReactNode;
  onScroll: Parameters<typeof ScrollView>[0]['onScroll'];
}) {
  const insets = useScreenInsets();
  return (
    <ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.md }]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: spacing.xxs,
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 18 },
  personText: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 23, letterSpacing: -0.36 },
  company: { fontSize: 14 },
  guest: { borderRadius: 18, padding: spacing.md, gap: spacing.sm },
  guestText: { fontSize: 14, lineHeight: 20 },
  tiles: { flexDirection: 'row', gap: 10, marginTop: spacing.xs },
  flex: { flex: 1 },
});
