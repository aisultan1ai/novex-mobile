import { formatDate, formatMoney, formatPhone, formatTime, isValidTaxId } from '@/lib/format';

const NBSP = ' ';

describe('formatMoney', () => {
  it.each([
    [15000, `15${NBSP}000${NBSP}₸`],
    ['1234567.6', `1${NBSP}234${NBSP}568${NBSP}₸`],
    [0, `0${NBSP}₸`],
    [999, `999${NBSP}₸`],
    [-2500, `−2${NBSP}500${NBSP}₸`],
  ])('%p → %p', (input, expected) => {
    expect(formatMoney(input)).toBe(expected);
  });

  it('некорректное значение → прочерк', () => {
    expect(formatMoney('abc')).toBe('—');
  });
});

describe('formatDate', () => {
  const now = new Date(2026, 9, 29);

  it('текущий год — без года', () => {
    expect(formatDate(new Date(2026, 9, 29, 14, 5), 'ru', now)).toBe('29 октября');
    expect(formatDate(new Date(2026, 9, 29), 'kk', now)).toBe('29 қазан');
  });

  it('другой год — с годом', () => {
    expect(formatDate(new Date(2025, 0, 3), 'ru', now)).toBe('3 января 2025');
  });

  it('некорректная дата → прочерк', () => {
    expect(formatDate('not a date', 'ru', now)).toBe('—');
  });
});

describe('formatTime', () => {
  it('24 часа с ведущими нулями', () => {
    expect(formatTime(new Date(2026, 9, 29, 9, 5))).toBe('09:05');
    expect(formatTime(new Date(2026, 9, 29, 21, 30))).toBe('21:30');
  });
});

describe('formatPhone', () => {
  it.each([
    '+77010000000',
    '87010000000',
    '7010000000',
    '+7 (701) 000-00-00',
  ])('%p → +7 701 000 00 00', (input) => {
    expect(formatPhone(input)).toBe('+7 701 000 00 00');
  });

  it('нераспознанный номер не меняется', () => {
    expect(formatPhone('+49 30 123456')).toBe('+49 30 123456');
    expect(formatPhone('+44 7911 123456')).toBe('+44 7911 123456');
    expect(formatPhone('12345')).toBe('12345');
  });
});

describe('isValidTaxId', () => {
  it('ровно 12 цифр', () => {
    expect(isValidTaxId('900101300123')).toBe(true);
    expect(isValidTaxId('90010130012')).toBe(false);
    expect(isValidTaxId('9001013001234')).toBe(false);
    expect(isValidTaxId('90010130012a')).toBe(false);
  });
});
