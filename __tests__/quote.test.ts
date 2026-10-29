import {
  defaultQuoteForm,
  matchPreset,
  quoteSchema,
  SIZE_PRESETS,
  toQuoteRequest,
  type QuoteFormValues,
} from '@/features/quote/quoteForm';
import { computeBadges, sortTariffs, type RateQuote } from '@/features/quote/tariffs';

const valid: QuoteFormValues = {
  ...defaultQuoteForm,
  fromCity: 'Алматы',
  toCity: 'Астана',
  weightKg: '1,5',
  ...{ widthCm: '20', heightCm: '10', depthCm: '15' },
};

const issues = (values: QuoteFormValues) => {
  const r = quoteSchema.safeParse(values);
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('форма расчёта', () => {
  it('корректная форма проходит, запятая в весе допустима', () => {
    expect(issues(valid)).toEqual({});
  });

  it('правила как на сайте', () => {
    expect(issues({ ...defaultQuoteForm })).toMatchObject({
      fromCity: 'quote.errors.fromCity',
      toCity: 'quote.errors.toCity',
      weightKg: 'quote.errors.weight',
      widthCm: 'quote.errors.dims',
    });
    expect(issues({ ...valid, weightKg: '1001' })).toEqual({ weightKg: 'quote.errors.weightMax' });
    expect(issues({ ...valid, quantity: '1.5' })).toEqual({ quantity: 'quote.errors.quantityInt' });
    expect(issues({ ...valid, depthCm: '501' })).toEqual({ depthCm: 'quote.errors.dimsMax' });
  });

  it('для документа габариты не нужны и уходят нулями', () => {
    const doc = { ...valid, shipmentType: 'document' as const, widthCm: '', heightCm: '', depthCm: '' };
    expect(issues(doc)).toEqual({});
    expect(toQuoteRequest(doc)).toMatchObject({ width_cm: 0, height_cm: 0, depth_cm: 0 });
  });

  it('toQuoteRequest — тело POST /shipping/quote', () => {
    expect(toQuoteRequest(valid)).toEqual({
      from_country: 'KZ',
      from_city: 'Алматы',
      to_country: 'KZ',
      to_city: 'Астана',
      shipment_type: 'parcel',
      weight_kg: 1.5,
      quantity: 1,
      width_cm: 20,
      height_cm: 10,
      depth_cm: 15,
    });
  });

  it('пресет узнаётся по значениям полей', () => {
    expect(matchPreset({ ...valid, ...SIZE_PRESETS.M })).toBe('M');
    expect(matchPreset({ ...valid, weightKg: '2' })).toBeNull();
  });
});

const rate = (id: number, price: string, min: number, max: number): RateQuote => ({
  id,
  carrier_code: `c${id}`,
  carrier_name: `Carrier ${id}`,
  tariff_name: 'Стандарт',
  price,
  currency: 'KZT',
  eta_days_min: min,
  eta_days_max: max,
  is_selected: false,
  available_services: [],
});

describe('тарифы', () => {
  const a = rate(1, '3500.00', 3, 5);
  const b = rate(2, '2900.00', 4, 7);
  const c = rate(3, '5200.00', 1, 2);

  it('бейджи «Дешевле всех» и «Быстрее всех»', () => {
    const badges = computeBadges([a, b, c]);
    expect(badges.get(b)).toEqual({ cheapest: true, fastest: false });
    expect(badges.get(c)).toEqual({ cheapest: false, fastest: true });
    expect(badges.get(a)).toEqual({ cheapest: false, fastest: false });
  });

  it('один тариф — без бейджей', () => {
    expect(computeBadges([a]).get(a)).toEqual({ cheapest: false, fastest: false });
  });

  it('сортировка по цене и по сроку', () => {
    expect(sortTariffs([a, b, c], 'price').map((q) => q.id)).toEqual([2, 1, 3]);
    expect(sortTariffs([a, b, c], 'eta').map((q) => q.id)).toEqual([3, 1, 2]);
  });
});
