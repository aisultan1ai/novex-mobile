import { z } from 'zod';

import type { components } from '@/api/schema';

type ShippingQuoteRequest = components['schemas']['ShippingQuoteRequest'];

export type ShipmentType = 'parcel' | 'document';

/** «1,5» → 1.5; пусто или мусор → NaN. */
export const toNumber = (value: string) => (value.trim() ? Number(value.replace(',', '.')) : NaN);

// Правила как на сайте (HomePage.validateQuoteForm), сообщения — ключи переводов quote.errors.*.
const positive = (emptyKey: string, max: number, maxKey: string) =>
  z
    .string()
    .refine((v) => toNumber(v) > 0, emptyKey)
    .refine((v) => !(toNumber(v) > max), maxKey);

export const quoteSchema = z
  .object({
    fromCity: z.string().trim().min(1, 'quote.errors.fromCity'),
    toCity: z.string().trim().min(1, 'quote.errors.toCity'),
    shipmentType: z.enum(['parcel', 'document']),
    weightKg: positive('quote.errors.weight', 1000, 'quote.errors.weightMax'),
    quantity: positive('quote.errors.quantity', 999, 'quote.errors.quantityMax').refine(
      (v) => Number.isInteger(toNumber(v)),
      'quote.errors.quantityInt',
    ),
    widthCm: z.string(),
    heightCm: z.string(),
    depthCm: z.string(),
  })
  .superRefine((values, ctx) => {
    // Габариты обязательны для посылки: по ним считается объёмный вес, а CSE требует их в накладной.
    if (values.shipmentType === 'document') return;
    for (const key of ['widthCm', 'heightCm', 'depthCm'] as const) {
      const v = toNumber(values[key]);
      if (!(v > 0)) ctx.addIssue({ code: 'custom', path: [key], message: 'quote.errors.dims' });
      else if (v > 500)
        ctx.addIssue({ code: 'custom', path: [key], message: 'quote.errors.dimsMax' });
    }
  });

export type QuoteFormValues = z.infer<typeof quoteSchema>;

export type SizePreset = 'S' | 'M' | 'L';

type Dims = Pick<QuoteFormValues, 'widthCm' | 'heightCm' | 'depthCm'>;

export interface SizePresetDef extends Dims {
  /** Вес, который подставляется при выборе размера (макеты v2: 1,5 / 3,5 / 8 кг). */
  weightKg: string;
  /** Подпись «до N кг». */
  limitKg: number;
}

// Быстрые размеры (ТЗ 6.4.3, DESIGN-TZ 6.3). Веса и подписи — из макетов; габариты — типовые коробки,
// согласовать с Novex.
export const SIZE_PRESETS: Record<SizePreset, SizePresetDef> = {
  S: { weightKg: '1,5', limitKg: 2, widthCm: '20', heightCm: '10', depthCm: '15' },
  M: { weightKg: '3,5', limitKg: 5, widthCm: '35', heightCm: '20', depthCm: '25' },
  L: { weightKg: '8', limitKg: 10, widthCm: '50', heightCm: '35', depthCm: '40' },
};

export const defaultQuoteForm: QuoteFormValues = {
  fromCity: '',
  toCity: '',
  shipmentType: 'parcel',
  weightKg: SIZE_PRESETS.M.weightKg,
  quantity: '1',
  widthCm: SIZE_PRESETS.M.widthCm,
  heightCm: SIZE_PRESETS.M.heightCm,
  depthCm: SIZE_PRESETS.M.depthCm,
};

/** Какой размер выбран — по габаритам: правка веса вручную не сбрасывает выбор. */
export function matchPreset(values: Dims): SizePreset | null {
  for (const name of Object.keys(SIZE_PRESETS) as SizePreset[]) {
    const p = SIZE_PRESETS[name];
    const same = (['widthCm', 'heightCm', 'depthCm'] as const).every(
      (k) => toNumber(values[k]) === toNumber(p[k]),
    );
    if (same) return name;
  }
  return null;
}

/** Форма → тело POST /shipping/quote. Для документов габариты не нужны — отправляем 0, как сайт. */
export function toQuoteRequest(values: QuoteFormValues): ShippingQuoteRequest {
  const isDoc = values.shipmentType === 'document';
  const dim = (v: string) => (isDoc ? 0 : toNumber(v) || 0);
  return {
    from_country: 'KZ',
    from_city: values.fromCity.trim(),
    to_country: 'KZ',
    to_city: values.toCity.trim(),
    shipment_type: values.shipmentType,
    weight_kg: toNumber(values.weightKg),
    quantity: toNumber(values.quantity),
    width_cm: dim(values.widthCm),
    height_cm: dim(values.heightCm),
    depth_cm: dim(values.depthCm),
  };
}
