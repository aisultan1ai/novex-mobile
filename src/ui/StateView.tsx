import { CircleAlert, Inbox, WifiOff } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/api/errors';

import { Button } from './Button';
import { Text } from './Text';
import { useColors } from './theme';
import { spacing } from './tokens';

// Общие состояния экрана (ТЗ 4, правило 5): загрузка, пусто, ошибка с «Повторить», нет сети.
// Скелетоны для конкретных списков появятся вместе с экранами; здесь — запасной вариант.

export type StateViewProps =
  | { kind: 'loading' }
  | { kind: 'empty'; title?: string; text?: string }
  | { kind: 'error'; error: unknown; onRetry?: () => void };

export function StateView(props: StateViewProps) {
  const colors = useColors();
  const { t } = useTranslation();

  if (props.kind === 'loading') {
    return (
      <View style={styles.center} accessibilityLabel={t('common.loading')}>
        <ActivityIndicator color={colors.icon} />
      </View>
    );
  }

  if (props.kind === 'empty') {
    return (
      <View style={styles.center}>
        <Inbox color={colors.icon} size={40} strokeWidth={1.5} />
        <Text variant="heading" style={styles.title}>
          {props.title ?? t('state.emptyTitle')}
        </Text>
        {props.text ? (
          <Text tone="muted" style={styles.text}>
            {props.text}
          </Text>
        ) : null}
      </View>
    );
  }

  const error = props.error instanceof ApiError ? props.error : null;
  const offline = error?.kind === 'network';
  const rateLimited = error?.kind === 'rate_limit';
  const Icon = offline ? WifiOff : CircleAlert;

  const title = offline
    ? t('state.offlineTitle')
    : rateLimited
      ? t('state.rateLimitTitle')
      : t('state.errorTitle');
  // Текст с бэкенда уже на языке пользователя — показываем его как есть (ТЗ 5.4).
  const text = offline
    ? t('state.offlineText')
    : rateLimited
      ? t('state.rateLimitText')
      : error?.message || t('state.errorText');

  return (
    <View style={styles.center}>
      <Icon color={colors.icon} size={40} strokeWidth={1.5} />
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      <Text tone="muted" style={styles.text}>
        {text}
      </Text>
      {props.onRetry ? (
        <Button
          title={t('common.retry')}
          variant="secondary"
          onPress={props.onRetry}
          style={styles.retry}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { marginTop: spacing.md, textAlign: 'center' },
  text: { marginTop: spacing.xs, textAlign: 'center' },
  retry: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
