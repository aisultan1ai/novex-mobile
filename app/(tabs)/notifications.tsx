import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/features/placeholder/ComingSoon';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={t('tabs.notifications')} />;
}
