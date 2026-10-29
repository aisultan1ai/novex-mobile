import { formatPhone } from '@/lib/format';
import { resolveCity } from '@/lib/cities';

/**
 * Разбор вставленного адреса по полям (Smart Paste).
 * «г. Алматы, ул. Абая 150, кв 45» → { city: 'Алматы', street: 'ул. Абая', house: '150', apartment: '45' }.
 * Понимает русские и казахские обозначения, «150-45» как дом-квартира, индекс и телефон.
 * Чистая функция без React — легко тестировать и переиспользовать (адресная книга, пакеты).
 */
export interface ParsedAddress {
  city?: string;
  street?: string;
  house?: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  postalCode?: string;
  phone?: string;
}

const NUM = String.raw`\d+[а-яәa-z]?(?:\/\d+[а-яa-z]?)?`;

// Обозначения перед числом: «кв 45», «д. 150», «подъезд 2»…
const APARTMENT = new RegExp(
  String.raw`^(?:кв(?:артира)?|оф(?:ис)?|пәтер)\.?\s*№?\s*(${NUM})$`,
  'i',
);
const HOUSE = new RegExp(String.raw`^(?:д(?:ом)?|үй)\.?\s*№?\s*(${NUM})$`, 'i');
const ENTRANCE = /^(?:подъезд|под\.|п\.|кіреберіс)\s*№?\s*(\d+)$/i;
const FLOOR = /^(?:этаж|эт\.|қабат)\s*(\d+)$/i;
// Казахский порядок: «45 пәтер», «2 қабат», «3 кіреберіс».
const APARTMENT_AFTER = new RegExp(String.raw`^(${NUM})\s*(?:пәтер|кв\.?)$`, 'i');
const FLOOR_AFTER = /^(\d+)\s*(?:қабат|этаж)$/i;
const ENTRANCE_AFTER = /^(\d+)\s*(?:кіреберіс|подъезд)$/i;

const CITY_PREFIX = /^(?:г\.|город|гор\.)\s*(.+)$/i;
const CITY_SUFFIX = /^(.+?)\s+(?:қаласы|қ\.)$/i;
const POSTAL = /^(?:\d{6}|[a-z]\d{2}[a-z]\d[a-z]\d)$/i;
const PHONE = /^\+?[78][\d\s\-()]{9,}$/;

// Улица + номер дома в одном сегменте: «Абая 150», «пр. Достык 97Б-12», «Абая, д. 150» уже разрезан запятой.
const STREET_WITH_HOUSE = new RegExp(
  String.raw`^(.*?[^\d\s-])\s+(?:д(?:ом)?\.?\s*|үй\s*)?№?\s*(${NUM})(?:\s*-\s*(\d+))?$`,
  'i',
);
// «мкр 4» — номер микрорайона, а не дома.
const DISTRICT_ONLY = /^(?:мкр|мкрн|микрорайон|ш\.а\.|шағын\s+аудан|квартал|ж\.м\.|жилмассив)\.?$/i;
const STREET_MARKER =
  /(?:^|\s)(?:ул\.|улица|пр\.|просп\.|проспект|пер\.|переулок|б-р|бульвар|мкр\.?|мкрн|микрорайон|шоссе|тракт|көшесі|даңғылы|шағын\s+аудан|ж\.м\.)(?:\s|$)/i;
const ONLY_NUMBER = new RegExp(String.raw`^№?\s*(${NUM})(?:\s*-\s*(\d+))?$`, 'i');

export function parseAddress(text: string): ParsedAddress | null {
  const segments = text
    .replace(/[;\n\r]+/g, ',')
    .split(',')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const result: ParsedAddress = {};
  // Текст без номера, который может оказаться улицей: «Абая, 150».
  let pendingStreet: string | undefined;

  const setHouse = (house: string, apartment?: string) => {
    result.house ??= house;
    if (apartment) result.apartment ??= apartment;
  };

  for (const segment of segments) {
    let m: RegExpMatchArray | null;

    if (POSTAL.test(segment)) {
      result.postalCode ??= segment.toUpperCase();
      continue;
    }
    if (PHONE.test(segment)) {
      const phone = formatPhone(segment);
      if (/^\+7 \d{3} \d{3} \d{2} \d{2}$/.test(phone)) result.phone ??= phone;
      continue;
    }
    if ((m = segment.match(APARTMENT) ?? segment.match(APARTMENT_AFTER))) {
      result.apartment ??= m[1];
      continue;
    }
    if ((m = segment.match(ENTRANCE) ?? segment.match(ENTRANCE_AFTER))) {
      result.entrance ??= m[1];
      continue;
    }
    if ((m = segment.match(FLOOR) ?? segment.match(FLOOR_AFTER))) {
      result.floor ??= m[1];
      continue;
    }
    if ((m = segment.match(HOUSE))) {
      setHouse(m[1]!);
      continue;
    }

    const cityName = segment.match(CITY_PREFIX)?.[1] ?? segment.match(CITY_SUFFIX)?.[1] ?? segment;
    const city = resolveCity(cityName);
    if (city && !result.city) {
      result.city = city;
      continue;
    }

    if ((m = segment.match(ONLY_NUMBER))) {
      // Голое число: сначала дом (если улица уже есть), потом квартира.
      if (!result.house && (result.street || pendingStreet)) {
        result.street ??= pendingStreet;
        setHouse(m[1]!, m[2]);
      } else if (result.house) {
        result.apartment ??= m[1];
      }
      continue;
    }

    m = segment.match(STREET_WITH_HOUSE);
    if (m && !DISTRICT_ONLY.test(m[1]!.trim()) && !result.street) {
      result.street = m[1]!.trim();
      setHouse(m[2]!, m[3]);
      continue;
    }

    if (!result.street) {
      // Улица с явным обозначением приоритетнее любого текста (имя получателя и т. п.).
      if (STREET_MARKER.test(segment) || !pendingStreet) pendingStreet = segment;
    }
  }

  if (!result.street && pendingStreet && (result.house || STREET_MARKER.test(pendingStreet))) {
    result.street = pendingStreet;
  }

  // Без дома или квартиры это не адрес (обычный ввод, а не вставка) — ничего не трогаем.
  if (!result.house && !result.apartment) return null;
  return result;
}

/** Поля интерфейса → две строки адреса API (`address_line1`, `address_line2`). */
export function toAddressLines(fields: {
  street: string;
  house: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
}): { address_line1: string; address_line2: string | null } {
  const line1 = [fields.street.trim(), fields.house.trim()].filter(Boolean).join(', ');
  // Подписи по-русски: строка уходит перевозчику и курьеру, а не показывается в интерфейсе.
  const line2 = [
    fields.apartment?.trim() && `кв. ${fields.apartment.trim()}`,
    fields.entrance?.trim() && `подъезд ${fields.entrance.trim()}`,
    fields.floor?.trim() && `этаж ${fields.floor.trim()}`,
  ]
    .filter(Boolean)
    .join(', ');
  return { address_line1: line1, address_line2: line2 || null };
}
