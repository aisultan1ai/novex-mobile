import ru from '@/i18n/ru.json';
import kk from '@/i18n/kk.json';
import { describeStatus } from '@/lib/orderStatus';

// Таблица из ТЗ 5.7.
const TABLE: Record<string, string[]> = {
  preparing: ['draft', 'shipment_details_completed', 'ready_for_checkout'],
  awaitingPayment: ['awaiting_payment', 'payment_rejected'],
  paymentReview: ['payment_under_review'],
  handover: ['paid', 'dispatch_queued', 'dispatch_failed', 'pending_manual', 'pending_manual_dispatch'],
  inTransit: [
    'sent_to_carrier',
    'picked_up',
    'in_transit',
    'arrived',
    'out_for_delivery',
    'customs_hold',
  ],
  problem: ['delivery_failed'],
  delivered: ['delivered'],
  return: ['return_requested', 'return_in_progress', 'returned'],
  cancelled: ['cancelled'],
};

describe('describeStatus', () => {
  for (const [group, statuses] of Object.entries(TABLE)) {
    it.each(statuses)(`%s → ${group}`, (status) => {
      expect(describeStatus(status).group).toBe(group);
    });
  }

  it('цвета групп по ТЗ', () => {
    expect(describeStatus('in_transit').tone).toBe('transit');
    expect(describeStatus('delivery_failed').tone).toBe('danger');
    expect(describeStatus('delivered').tone).toBe('success');
    expect(describeStatus('cancelled').tone).toBe('neutral');
  });

  it('неизвестный статус → «Обрабатывается»', () => {
    expect(describeStatus('teleported')).toEqual({ group: 'processing', tone: 'neutral' });
    expect(describeStatus('toString').group).toBe('processing');
  });

  it('у каждого статуса и группы есть перевод на ru и kk', () => {
    const groups = [...Object.keys(TABLE), 'processing'];
    for (const dict of [ru, kk]) {
      for (const status of Object.values(TABLE).flat()) {
        expect(dict.orderStatus).toHaveProperty(status);
      }
      for (const group of groups) {
        expect(dict.statusGroup).toHaveProperty(group);
      }
    }
  });
});
