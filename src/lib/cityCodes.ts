import { resolveCity } from './cities';

/**
 * Коды городов «как в авиабилетах» (DESIGN-TZ 5): IATA-код аэропорта города, иначе первые три буквы
 * названия транслитом. Код декоративный — рядом всегда показывается полное название, а экранный диктор
 * читает название, не код.
 *
 * Коды сверены со списком аэропортов Казахстана (en.wikipedia.org/wiki/List_of_airports_in_Kazakhstan,
 * октябрь 2026). Зайсан не включён: источники расходятся (SZI / ZSI), — для него работает транслит.
 */
const IATA: Record<string, string> = {
  Алматы: 'ALA',
  Астана: 'NQZ',
  Шымкент: 'CIT',
  Караганда: 'KGF',
  Актобе: 'AKX',
  Атырау: 'GUW',
  Актау: 'SCO',
  Петропавловск: 'PPK',
  Кокшетау: 'KOV',
  Жезказган: 'DZN',
  Павлодар: 'PWQ',
  Оскемен: 'UKK',
  'Усть-Каменогорск': 'UKK',
  Семей: 'PLX',
  Костанай: 'KSN',
  Кызылорда: 'KZO',
  Тараз: 'DMB',
  Уральск: 'URA',
  Туркестан: 'HSA',
  Талдыкорган: 'TDK',
  Балхаш: 'BXH',
  Аркалык: 'AYK',
  Атбасар: 'ATX',
  Экибастуз: 'EKB',
  Урджар: 'UZR',
  Ушарал: 'USJ',
};

// Транслит кириллицы (русской и казахской) в латиницу — только для запасного кода.
const TRANSLIT: Record<string, string> = {
  а: 'A',
  ә: 'A',
  б: 'B',
  в: 'V',
  г: 'G',
  ғ: 'G',
  д: 'D',
  е: 'E',
  ё: 'E',
  ж: 'ZH',
  з: 'Z',
  и: 'I',
  і: 'I',
  й: 'Y',
  к: 'K',
  қ: 'K',
  л: 'L',
  м: 'M',
  н: 'N',
  ң: 'N',
  о: 'O',
  ө: 'O',
  п: 'P',
  р: 'R',
  с: 'S',
  т: 'T',
  у: 'U',
  ұ: 'U',
  ү: 'U',
  ф: 'F',
  х: 'KH',
  һ: 'H',
  ц: 'TS',
  ч: 'CH',
  ш: 'SH',
  щ: 'SCH',
  ъ: '',
  ы: 'Y',
  ь: '',
  э: 'E',
  ю: 'YU',
  я: 'YA',
};

function translitCode(name: string): string {
  const latin = [...name.toLocaleLowerCase('ru')]
    .map((ch) => TRANSLIT[ch] ?? (/[a-z]/.test(ch) ? ch.toUpperCase() : ''))
    .join('');
  return latin.slice(0, 3);
}

/** «Алматы» → ALA, «Ақтөбе» → AKX, «Каскелен» → KAS. Пустая строка → «—». */
export function cityCode(city: string): string {
  const name = city.trim();
  if (!name) return '—';
  const canonical = resolveCity(name) ?? name;
  return IATA[canonical] ?? (translitCode(canonical) || '—');
}
