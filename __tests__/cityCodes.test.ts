import { cityCode } from '@/lib/cityCodes';
import { KZ_CITIES } from '@/lib/cities.data';

describe('cityCode', () => {
  it.each([
    ['Алматы', 'ALA'],
    ['Астана', 'NQZ'],
    ['Шымкент', 'CIT'],
    ['Караганда', 'KGF'],
    ['Актобе', 'AKX'],
    ['Атырау', 'GUW'],
    ['Актау', 'SCO'],
    ['Петропавловск', 'PPK'],
    ['Кокшетау', 'KOV'],
    ['Жезказган', 'DZN'],
    ['Павлодар', 'PWQ'],
    ['Оскемен', 'UKK'],
    ['Семей', 'PLX'],
    ['Костанай', 'KSN'],
    ['Кызылорда', 'KZO'],
    ['Тараз', 'DMB'],
    ['Уральск', 'URA'],
    ['Туркестан', 'HSA'],
    ['Талдыкорган', 'TDK'],
    ['Балхаш', 'BXH'],
  ])('%s → %s (IATA, таблица DESIGN-TZ 5)', (city, code) => {
    expect(cityCode(city)).toBe(code);
  });

  it('понимает казахские названия и регистр', () => {
    expect(cityCode('Ақтөбе')).toBe('AKX');
    expect(cityCode('Орал')).toBe('URA');
    expect(cityCode('алматы')).toBe('ALA');
  });

  it('без аэропорта — первые три буквы транслитом', () => {
    expect(cityCode('Каскелен')).toBe('KAS');
    expect(cityCode('Жанаозен')).toBe('ZHA');
    expect(cityCode('Щучинск')).toBe('SCH');
  });

  it('пусто → прочерк', () => {
    expect(cityCode('  ')).toBe('—');
  });

  it('у каждого города из списка есть код из трёх латинских букв', () => {
    for (const city of KZ_CITIES) {
      expect(cityCode(city.value)).toMatch(/^[A-Z]{3}$/);
    }
  });
});
