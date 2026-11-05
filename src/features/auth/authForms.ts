import { z } from 'zod';

import type { RegisterRequest } from '@/api/endpoints/auth';
import { formatPhone, isValidTaxId } from '@/lib/format';

// Сообщения — ключи переводов (src/lib/forms.ts). Ограничения длины — из RegisterRequest.

export const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const KZ_PHONE = /^\+7 \d{3} \d{3} \d{2} \d{2}$/;

/** Пробел по краям (его часто добавляет автоподстановка клавиатуры) — не ошибка: обрезаем до проверки. */
export const emailField = z.string().trim().pipe(z.email('validation.email'));

const password = z
  .string()
  .min(PASSWORD_MIN, 'validation.passwordShort')
  .max(PASSWORD_MAX, 'validation.tooLong');

export const registerSchema = z
  .object({
    customerType: z.enum(['individual', 'company']),
    fullName: z.string().trim().max(255, 'validation.tooLong'),
    companyName: z.string().trim().max(255, 'validation.tooLong'),
    email: emailField,
    phone: z.string(),
    taxId: z.string(),
    password,
    consent: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.customerType === 'company' && !v.companyName) {
      ctx.addIssue({
        code: 'custom',
        path: ['companyName'],
        message: 'validation.companyRequired',
      });
    }
    if (!isValidTaxId(v.taxId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['taxId'],
        message: v.customerType === 'company' ? 'validation.bin' : 'validation.iin',
      });
    }
    if (v.phone.trim() && !KZ_PHONE.test(formatPhone(v.phone))) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'validation.phone' });
    }
    if (!v.consent) {
      ctx.addIssue({ code: 'custom', path: ['consent'], message: 'validation.consent' });
    }
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const registerDefaults: RegisterValues = {
  customerType: 'individual',
  fullName: '',
  companyName: '',
  email: '',
  phone: '',
  taxId: '',
  password: '',
  consent: false,
};

/** Форма → тело /auth/register: пустые необязательные поля — null, телефон в формате +7 701 000 00 00. */
export function toRegisterRequest(v: RegisterValues): RegisterRequest {
  const isCompany = v.customerType === 'company';
  return {
    email: v.email.trim().toLowerCase(),
    password: v.password,
    full_name: v.fullName.trim() || null,
    phone: v.phone.trim() ? formatPhone(v.phone) : null,
    customer_type: v.customerType,
    company_name: isCompany ? v.companyName.trim() || null : null,
    tax_id: v.taxId,
    pd_consent: v.consent,
  };
}

/**
 * Поля 422 от бэкенда (имена из RegisterRequest) → поля формы.
 * Неизвестные поля не теряются: экран покажет их общим текстом ошибки.
 */
export const registerApiFields: Record<string, keyof RegisterValues> = {
  email: 'email',
  password: 'password',
  full_name: 'fullName',
  phone: 'phone',
  company_name: 'companyName',
  tax_id: 'taxId',
  pd_consent: 'consent',
};

export const emailSchema = z.object({ email: emailField });

export const resetSchema = z
  .object({ password, repeat: z.string() })
  .refine((v) => v.password === v.repeat, {
    path: ['repeat'],
    message: 'validation.passwordMismatch',
  });
