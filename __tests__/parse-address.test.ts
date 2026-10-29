import { parseAddress, toAddressLines } from '@/features/address/parseAddress';
import { cityLabel, resolveCity, searchCities } from '@/lib/cities';

describe('parseAddress', () => {
  it.each<[string, Record<string, string>]>([
    ['Абая 150, кв 45', { street: 'Абая', house: '150', apartment: '45' }],
    [
      'г. Алматы, ул. Абая, д. 150, кв. 45',
      { city: 'Алматы', street: 'ул. Абая', house: '150', apartment: '45' },
    ],
    [
      'Алматы, пр. Достык 97Б-12',
      { city: 'Алматы', street: 'пр. Достык', house: '97Б', apartment: '12' },
    ],
    [
      'мкр Самал-2, 58, кв 3, подъезд 2, этаж 5',
      { street: 'мкр Самал-2', house: '58', apartment: '3', entrance: '2', floor: '5' },
    ],
    ['мкр 4, д 12', { street: 'мкр 4', house: '12' }],
    [
      'Астана қаласы, Сарайшық көшесі 5, 12 пәтер, 3 қабат',
      { city: 'Астана', street: 'Сарайшық көшесі', house: '5', apartment: '12', floor: '3' },
    ],
    [
      '050000, Алматы, Абая 150',
      { postalCode: '050000', city: 'Алматы', street: 'Абая', house: '150' },
    ],
    ['Z05T3E0, Астана, Кенесары 40', { postalCode: 'Z05T3E0', city: 'Астана', street: 'Кенесары', house: '40' }],
    ['Ақтөбе, Абылай хана 12/1', { city: 'Актобе', street: 'Абылай хана', house: '12/1' }],
    ['Абая, 150, 45', { street: 'Абая', house: '150', apartment: '45' }],
  ])('%s', (text, expected) => {
    expect(parseAddress(text)).toEqual(expected);
  });

  it('многострочный блок с именем и телефоном: улица — строка с номером дома, телефон отдельно', () => {
    expect(parseAddress('Иван Петров\n+7 701 123 45 67\nул. Абая 150, кв 45')).toEqual({
      phone: '+7 701 123 45 67',
      street: 'ул. Абая',
      house: '150',
      apartment: '45',
    });
  });

  it.each(['Абая', 'привет, как дела', 'Алматы', '', '   '])(
    'не адрес → null (обычный ввод не перехватываем): %p',
    (text) => {
      expect(parseAddress(text)).toBeNull();
    },
  );
});

describe('toAddressLines', () => {
  it('поля → address_line1 / address_line2 для API', () => {
    expect(
      toAddressLines({ street: 'ул. Абая', house: '150', apartment: '45', entrance: '2', floor: '' }),
    ).toEqual({ address_line1: 'ул. Абая, 150', address_line2: 'кв. 45, подъезд 2' });
  });

  it('без квартиры — вторая строка null', () => {
    expect(toAddressLines({ street: 'Абая', house: '1' })).toEqual({
      address_line1: 'Абая, 1',
      address_line2: null,
    });
  });
});

describe('города', () => {
  it('resolveCity понимает регистр, ё и казахские названия', () => {
    expect(resolveCity('алматы')).toBe('Алматы');
    expect(resolveCity('Ақтөбе')).toBe('Актобе');
    expect(resolveCity('Орал')).toBe('Уральск');
    expect(resolveCity('Гонконг')).toBeNull();
  });

  it('cityLabel: в kk — казахское название, value остаётся русским', () => {
    expect(cityLabel('Уральск', 'kk')).toBe('Орал');
    expect(cityLabel('Уральск', 'ru')).toBe('Уральск');
  });

  it('searchCities: совпадение с начала выше, ищет и по казахскому названию', () => {
    expect(searchCities('ал', 'ru')[0]?.value).toBe('Алматы');
    expect(searchCities('қарағ', 'kk').map((c) => c.value)).toContain('Караганда');
    expect(searchCities('', 'ru')).toEqual([]);
  });
});
