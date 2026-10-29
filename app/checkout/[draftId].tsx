import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/features/placeholder/ComingSoon';

// Шаги оформления и оплата — этап 2. Сюда ведёт «Оформить» после выбора тарифа (и входа).
export default function CheckoutScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={t('checkout.title')} />;
}
