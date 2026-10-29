import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/features/placeholder/ComingSoon';

export default function OrdersScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={t('tabs.orders')} />;
}
