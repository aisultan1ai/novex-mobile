import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, StateView, Text } from '@/ui';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <StateView kind="empty" title={t('notFound.title')} />
      <Link href="/" accessibilityRole="link">
        <Text variant="bodyStrong">{t('notFound.home')}</Text>
      </Link>
    </Screen>
  );
}
