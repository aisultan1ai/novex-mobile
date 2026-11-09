import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { CircleCheck, Link2Off, MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { resendVerification, verifyEmail } from '@/api/endpoints/auth';
import { ApiError } from '@/api/errors';
import { profileKeys, useProfile } from '@/features/profile/useProfile';
import { haptics } from '@/lib/haptics';
import { useSessionStore } from '@/store/session';
import { Button, RequestError, Screen, Text, screenPadding, spacing, useColors } from '@/ui';

import { AuthHeading, AuthScroll, AuthTopBar, useBackToSignIn, useCloseAuth } from './AuthChrome';

/**
 * Подтверждение email.
 *   С токеном (ссылка из письма, /verify-email?token=…) — подтверждаем и показываем результат.
 *   Без токена (после регистрации, из профиля) — «проверьте почту», «Я подтвердил», повторное письмо.
 * Без подтверждения можно входить и считать; оплачивать заказ — нет (как на сайте).
 */
export function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  return token ? <VerifyByLink token={token} /> : <CheckInbox />;
}

function VerifyByLink({ token }: { token: string }) {
  const { t } = useTranslation();
  const colors = useColors();
  const queryClient = useQueryClient();
  const backToSignIn = useBackToSignIn();
  const signedIn = useSessionStore((s) => s.status === 'signedIn');

  // Ссылка одноразовая: не повторять запрос и не перезапрашивать при возврате на экран.
  const verification = useQuery({
    queryKey: ['verify-email', token],
    queryFn: async () => {
      await verifyEmail(token);
      await queryClient.invalidateQueries({ queryKey: profileKeys.me });
      haptics.success();
      return true;
    },
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (verification.isPending) {
    return (
      <Screen>
        <AuthTopBar />
        <View style={styles.center} accessibilityLabel={t('verify.checking')}>
          <ActivityIndicator color={colors.icon} />
        </View>
      </Screen>
    );
  }

  if (verification.isSuccess) return <Verified />;

  // Сеть и сервер — можно повторить; остальное (400/404) — ссылка недействительна.
  const error = verification.error;
  const retryable = error instanceof ApiError ? error.isRetryable : true;

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {retryable ? (
            <Button title={t('common.retry')} onPress={() => void verification.refetch()} />
          ) : signedIn ? (
            <ResendButton />
          ) : (
            <Button title={t('auth.signIn')} onPress={backToSignIn} />
          )}
        </View>
      }
    >
      <AuthTopBar />
      <AuthScroll>
        <View style={styles.icon}>
          <Link2Off color={colors.danger} size={48} strokeWidth={1.5} />
        </View>
        {retryable ? (
          <RequestError error={error} />
        ) : (
          <AuthHeading
            title={t('verify.invalidTitle')}
            text={signedIn ? t('verify.invalidText') : t('verify.invalidTextGuest')}
          />
        )}
      </AuthScroll>
    </Screen>
  );
}

function CheckInbox() {
  const { t } = useTranslation();
  const colors = useColors();
  const close = useCloseAuth();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const signedIn = useSessionStore((s) => s.status === 'signedIn');
  const profile = useProfile();
  const [notYet, setNotYet] = useState(false);

  const email = profile.data?.email ?? emailParam;

  if (profile.data?.email_verified) return <Verified />;

  const checkAgain = async () => {
    const result = await profile.refetch();
    if (result.data?.email_verified) haptics.success();
    else {
      haptics.error();
      setNotYet(true);
    }
  };

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {signedIn ? (
            <Button
              title={t('verify.confirmed')}
              loading={profile.isRefetching}
              onPress={() => void checkAgain()}
            />
          ) : null}
          <Button variant="ghost" title={t('verify.later')} onPress={close} />
        </View>
      }
    >
      <AuthTopBar />
      <AuthScroll>
        <View style={styles.icon}>
          <MailCheck color={colors.strong} size={48} strokeWidth={1.5} />
        </View>
        <AuthHeading
          title={t('verify.title')}
          text={email ? t('verify.text', { email }) : t('verify.textNoEmail')}
        />
        {notYet ? (
          <Text tone="muted" accessibilityLiveRegion="polite">
            {t('verify.notYet')}
          </Text>
        ) : null}
        {signedIn ? <ResendButton variant="secondary" /> : null}
      </AuthScroll>
    </Screen>
  );
}

function Verified() {
  const { t } = useTranslation();
  const colors = useColors();
  const close = useCloseAuth();
  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button title={t('verify.done')} onPress={close} />
        </View>
      }
    >
      <AuthTopBar />
      <AuthScroll>
        <View style={styles.icon}>
          <CircleCheck color={colors.status.success} size={48} strokeWidth={1.5} />
        </View>
        <AuthHeading title={t('verify.doneTitle')} text={t('verify.doneText')} />
      </AuthScroll>
    </Screen>
  );
}

/** «Отправить письмо ещё раз». Бэкенд ограничивает частоту — его текст («подождите N сек.») показываем как есть. */
function ResendButton({ variant = 'primary' }: { variant?: 'primary' | 'secondary' }) {
  const { t } = useTranslation();
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<unknown>(null);

  const resend = async () => {
    setState('sending');
    setError(null);
    try {
      await resendVerification();
      haptics.success();
      setState('sent');
    } catch (e) {
      haptics.error();
      setError(e);
      setState('idle');
    }
  };

  return (
    <View style={styles.resend}>
      <Button
        variant={variant}
        title={state === 'sent' ? t('verify.sent') : t('verify.resend')}
        loading={state === 'sending'}
        disabled={state === 'sent'}
        onPress={() => void resend()}
      />
      <RequestError error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { marginTop: spacing.xl },
  resend: { gap: spacing.sm },
  footer: {
    gap: spacing.xs,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
});
