import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/features/placeholder/ComingSoon';

export default function ProfileScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={t('tabs.profile')} />;
}
