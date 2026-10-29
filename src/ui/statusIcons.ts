import {
  CircleCheckBig,
  CircleX,
  ClipboardList,
  LoaderCircle,
  PackageCheck,
  ReceiptText,
  TriangleAlert,
  Truck,
  Undo2,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

import type { StatusGroup, StatusTone } from '@/lib/orderStatus';

import type { ColorScheme } from './tokens';

/** Статус всегда текстом и иконкой, не только цветом (ТЗ 5.7). */
export const STATUS_ICONS: Record<StatusGroup, LucideIcon> = {
  processing: LoaderCircle,
  preparing: ClipboardList,
  awaitingPayment: Wallet,
  paymentReview: ReceiptText,
  handover: PackageCheck,
  inTransit: Truck,
  problem: TriangleAlert,
  delivered: CircleCheckBig,
  return: Undo2,
  cancelled: CircleX,
};

export const toneColor = (colors: ColorScheme, tone: StatusTone) => colors.status[tone];
