import { z } from 'zod';

import { resolveCity } from '@/lib/cities';

const optional = z.string().trim().max(20, 'validation.tooLong');

/** Адрес в интерфейсе — по полям; в API уходит через toAddressLines() двумя строками. */
export const addressSchema = z.object({
  city: z
    .string()
    .trim()
    .min(1, 'validation.cityRequired')
    .refine((v) => resolveCity(v) !== null, 'validation.cityUnknown'),
  street: z.string().trim().min(1, 'validation.streetRequired').max(200, 'validation.tooLong'),
  house: z.string().trim().min(1, 'validation.houseRequired').max(20, 'validation.tooLong'),
  apartment: optional,
  entrance: optional,
  floor: optional,
  postalCode: z
    .string()
    .trim()
    .regex(/^(\d{6}|[a-zA-Z]\d{2}[a-zA-Z]\d[a-zA-Z]\d)?$/, 'validation.postalCode'),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

export const ADDRESS_FIELDS = [
  'city',
  'street',
  'house',
  'apartment',
  'entrance',
  'floor',
  'postalCode',
] as const satisfies readonly (keyof AddressFormValues)[];

export const emptyAddress: AddressFormValues = {
  city: '',
  street: '',
  house: '',
  apartment: '',
  entrance: '',
  floor: '',
  postalCode: '',
};
