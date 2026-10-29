import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen, StateView, Text, spacing } from '@/ui';

/** Временная заглушка вкладки на этапе 0. */
export function ComingSoon({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <StateView kind="empty" title={t('common.comingSoon')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.md },
});
