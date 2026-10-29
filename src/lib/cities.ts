import type { Locale } from '@/api/client';

import { KK_CITY_NAMES, KZ_CITIES } from './cities.data';

export type City = (typeof KZ_CITIES)[number];
export type CityValue = City['value'];

/** Подпись города на языке интерфейса; в API всегда уходит русское `value`. */
export function cityLabel(value: string, locale: Locale): string {
  if (locale !== 'kk') return value;
  return KK_CITY_NAMES[value] ?? value;
}

const normalize = (s: string) => s.trim().toLocaleLowerCase('ru').replace(/ё/g, 'е');

// Индекс «любое написание → русское value»: и русское, и казахское название.
const BY_NAME = new Map<string, CityValue>();
for (const city of KZ_CITIES) BY_NAME.set(normalize(city.value), city.value);
for (const [ru, kk] of Object.entries(KK_CITY_NAMES)) {
  const value = BY_NAME.get(normalize(ru));
  if (value) BY_NAME.set(normalize(kk), value);
}

/** «алматы», «Ақтөбе», «Актобе» → русское value из списка; не из списка → null. */
export function resolveCity(name: string): CityValue | null {
  return BY_NAME.get(normalize(name)) ?? null;
}

/**
 * Поиск для автодополнения: совпадение с начала названия выше совпадения в середине,
 * областные центры выше районных. Ищет по русскому и казахскому названию.
 */
export function searchCities(query: string, locale: Locale, limit = 30): City[] {
  const q = normalize(query);
  if (!q) return [];
  const scored: { city: City; score: number }[] = [];
  for (const city of KZ_CITIES) {
    const names = [normalize(city.value), normalize(cityLabel(city.value, locale))];
    const starts = names.some((n) => n.startsWith(q));
    const contains = starts || names.some((n) => n.includes(q));
    if (!contains) continue;
    scored.push({ city, score: (starts ? 0 : 2) + (city.type === 'regional' ? 0 : 1) });
  }
  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => s.city);
}

export const REGIONAL_CITIES = KZ_CITIES.filter((c) => c.type === 'regional');
