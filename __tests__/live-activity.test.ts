import {
  planLiveActivity,
  setLiveActivityBridge,
  type LiveActivityBridge,
} from '@/features/tracking/liveActivity';
import { phaseOf, toLiveState, type PublicTracking } from '@/features/tracking/liveState';
import { useTrackedShipments } from '@/features/tracking/trackedShipments';

const tracking = (status: string, extra: Partial<PublicTracking> = {}): PublicTracking => ({
  tracking_number: 'NX1',
  carrier_code: 'cse',
  carrier_name: 'CSE',
  from_city: 'Алматы',
  to_city: 'Астана',
  order_status: status,
  eta_days_min: 2,
  eta_days_max: 4,
  created_at: '2026-10-27T09:00:00Z',
  events: [
    { status: 'picked_up', description: 'Забран', location: 'Алматы', occurred_at: '2026-10-27T12:00:00Z' },
    { status: 'in_transit', description: 'В пути', location: 'Караганда', occurred_at: '2026-10-28T08:00:00Z' },
  ],
  ...extra,
});

describe('состояние отправления', () => {
  it('фазы для Dynamic Island', () => {
    expect(phaseOf('out_for_delivery')).toBe('outForDelivery');
    expect(phaseOf('in_transit')).toBe('onTheWay');
    expect(phaseOf('delivery_failed')).toBe('problem');
    expect(phaseOf('delivered')).toBe('delivered');
    expect(phaseOf('cancelled')).toBe('closed');
    expect(phaseOf('paid')).toBe('preparing');
    expect(phaseOf('что-то новое')).toBe('preparing');
  });

  it('toLiveState: окно доставки, последнее событие, группа и цвет', () => {
    const state = toLiveState(tracking('in_transit'), new Date('2026-10-29T10:00:00Z'));
    expect(state).toMatchObject({
      group: 'inTransit',
      tone: 'transit',
      phase: 'onTheWay',
      etaFrom: '2026-10-29T09:00:00.000Z',
      etaTo: '2026-10-31T09:00:00.000Z',
      lastEvent: { description: 'В пути', location: 'Караганда', at: '2026-10-28T08:00:00Z' },
      fetchedAt: '2026-10-29T10:00:00.000Z',
    });
  });

  it('доставлено: окна нет, есть дата вручения', () => {
    const state = toLiveState(
      tracking('delivered', { delivery: { delivered_at: '2026-10-29T14:05:00Z' } }),
    );
    expect(state).toMatchObject({ etaFrom: null, etaTo: null, deliveredAt: '2026-10-29T14:05:00Z' });
  });

  it('состояние сериализуется без потерь (уходит в AsyncStorage и ActivityKit)', () => {
    const state = toLiveState(tracking('out_for_delivery'));
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});

describe('Live Activity', () => {
  const at = (status: string, extra: Partial<PublicTracking> = {}) => toLiveState(tracking(status, extra));

  it('план: начать в пути, обновить при изменении, закончить при доставке', () => {
    expect(planLiveActivity(undefined, at('paid'))).toBe('none');
    expect(planLiveActivity(at('paid'), at('in_transit'))).toBe('upsert');
    expect(planLiveActivity(at('in_transit'), at('in_transit'))).toBe('none');
    expect(planLiveActivity(at('in_transit'), at('out_for_delivery'))).toBe('upsert');
    expect(planLiveActivity(at('out_for_delivery'), at('delivered'))).toBe('end');
    expect(planLiveActivity(at('out_for_delivery'), at('delivery_failed'))).toBe('end');
  });

  it('store передаёт изменения в мост, ошибка моста не ломает приложение', async () => {
    const bridge: LiveActivityBridge = {
      upsert: jest.fn(async () => undefined),
      end: jest.fn(async () => {
        throw new Error('ActivityKit недоступен');
      }),
    };
    setLiveActivityBridge(bridge);
    const { upsert } = useTrackedShipments.getState();

    upsert(at('in_transit'));
    upsert(at('out_for_delivery'));
    upsert(at('delivered'));
    await Promise.resolve();

    expect(bridge.upsert).toHaveBeenCalledTimes(2);
    expect(bridge.end).toHaveBeenCalledWith('NX1', expect.objectContaining({ phase: 'delivered' }));
    expect(useTrackedShipments.getState().recent).toEqual(['NX1']);
    setLiveActivityBridge(null);
  });
});
