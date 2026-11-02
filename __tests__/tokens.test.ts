import { darkColors, lightColors, type ColorScheme } from '@/ui/tokens';

// Контраст по WCAG 2.x (DESIGN-TZ 2.3, 10): обычный текст ≥ 4.5:1.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

type Key = Exclude<keyof ColorScheme, 'status'>;
const PAIRS: [fg: Key, bg: Key, what: string][] = [
  ['text', 'background', 'основной текст'],
  ['text', 'subtle', 'текст на сером блоке'],
  ['text', 'card', 'текст на карточке'],
  ['textMuted', 'background', 'вторичный текст'],
  ['textMuted', 'subtle', 'вторичный текст на сером блоке'],
  ['textMuted', 'card', 'вторичный текст на карточке'],
  ['onPrimary', 'primary', 'текст главной кнопки'],
  ['onNavy', 'navy', 'текст на navy (активный чип, аватар)'],
  ['navy', 'background', 'цены'],
  ['navy', 'card', 'цены на карточке'],
  ['danger', 'subtle', '«Выйти» на сером'],
  ['iconInactive', 'background', 'неактивные иконки таб-бара (≥ 3:1)'],
];

describe.each([
  ['светлая', lightColors],
  ['тёмная', darkColors],
])('контраст, %s тема', (_, colors) => {
  it.each(PAIRS)('%s на %s — %s', (fg, bg, what) => {
    const min = what.includes('≥ 3:1') ? 3 : 4.5;
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(min);
  });
});

describe('правило «cyan не цвет текста на белом»', () => {
  it('cyan на белом не дотягивает до 4.5 — поэтому он только фон кнопки и рамка выбора', () => {
    expect(contrast(lightColors.accent, lightColors.background)).toBeLessThan(4.5);
  });
});
