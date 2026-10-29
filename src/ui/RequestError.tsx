import { CircleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { Text } from './Text';
import { useColors } from './theme';
import { radii, spacing } from './tokens';

/** Ошибка запроса под формой: текст бэкенда как есть, для сети и лимита — свой (ТЗ 5.4). */
export function RequestError({ error }: { error: unknown }) {
  const { t } = useTranslation();
  const colors = useColors();
  if (!error) return null;

  const apiError = error instanceof ApiError ? error : null;
  const text =
    apiError?.kind === 'network'
      ? t('state.offlineText')
      : apiError?.kind === 'rate_limit'
        ? t('state.rateLimitText')
        : apiError?.message || t('state.errorText');

  return (
    <View
      accessibilityLiveRegion="assertive"
      style={[styles.box, { backgroundColor: colors.subtle, borderColor: colors.status.danger }]}
    >
      <CircleAlert color={colors.status.danger} size={20} strokeWidth={1.75} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.button,
    borderWidth: 1,
  },
  text: { flex: 1 },
});
