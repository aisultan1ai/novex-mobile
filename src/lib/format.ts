import type { Locale } from '@/api/client';

// Форматы из ТЗ 6.2: `15 000 ₸`, `29 октября`, 24 ч, `+7 701 000 00 00`, ИИН/БИН 12 цифр.
// Intl не используем: в Hermes набор локалей зависит от платформы, а kk может не оказаться.

const NBSP = ' ';

function groupThousands(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** Сумма в тенге. Строки тоже принимаются — бэкенд отдаёт деньги и числом, и строкой. */
export function formatMoney(amount: number | string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '−' : '';
  return `${sign}${groupThousands(String(Math.abs(rounded)))}${NBSP}₸`;
}

const MONTHS: Record<Locale, string[]> = {
  ru: [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ],
  kk: [
    'қаңтар',
    'ақпан',
    'наурыз',
    'сәуір',
    'мамыр',
    'маусым',
    'шілде',
    'тамыз',
    'қыркүйек',
    'қазан',
    'қараша',
    'желтоқсан',
  ],
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** `29 октября`; год добавляется, только если он не текущий: `29 октября 2025`. */
export function formatDate(value: Date | string, locale: Locale, now: Date = new Date()): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  const base = `${date.getDate()} ${MONTHS[locale][date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? base : `${base} ${date.getFullYear()}`;
}

/** Время в 24-часовом формате: `09:05`. */
export function formatTime(value: Date | string): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Казахстанский номер → `+7 701 000 00 00`. Нераспознанный номер возвращается как есть. */
export function formatPhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+') && !trimmed.startsWith('+7')) return raw;
  let digits = trimmed.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  // 10 цифр без кода страны: казахстанские номера начинаются с 7 (701…, 727…).
  if (digits.length === 10 && digits.startsWith('7')) digits = `7${digits}`;
  if (digits.length !== 11 || !digits.startsWith('7')) return raw;
  const d = digits;
  return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
}

/** ИИН / БИН — ровно 12 цифр. Контрольную сумму бэкенд не проверяет, приложение тоже. */
export function isValidTaxId(value: string): boolean {
  return /^\d{12}$/.test(value);
}
