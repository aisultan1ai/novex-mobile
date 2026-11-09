import { Platform } from 'react-native';

// Единственный источник цветов, шрифтов, отступов и анимаций (ТЗ 4, правило 3; DESIGN-TZ.md, раздел 2).
//
// «Вес» интерфейса (выбранный чип, цены, активная вкладка) — почти чёрный ink, а не navy;
// cyan — только главная кнопка и выбранное, navy — только знак и словесный знак Novex.
// Абрикос — иллюстрации онбординга и тёплая подложка аватара, не текст.

const brand = {
  navy: '#0B2545',
  cyan: '#22C9E0',
  cyanPressed: '#1AB3C8',
  cyanGlow: 'rgba(34,201,224,0.18)',
  steel: '#3E6E8A',
  ink: '#0E1826',
  white: '#FFFFFF',
  apricot: '#F4B183',
  apricotSoft: '#FCE6D4',
} as const;

/** Цвета знака Novex — одинаковые в обеих темах. */
export const logoColors = { node: brand.cyan, branch: brand.steel, wordmark: brand.navy } as const;

/** Заливки иллюстраций онбординга — одинаковы в обеих темах; линии и «бумага» берутся из темы. */
export const illustration = {
  apricot: brand.apricot,
  apricotSoft: brand.apricotSoft,
  cyan: brand.cyan,
} as const;

const status = {
  neutral: '#8FA3B2',
  transit: '#F5A623',
  danger: '#E24B4A',
  success: '#12B886',
} as const;

export interface ColorScheme {
  /** Фон экранов. */
  background: string;
  card: string;
  /** Поле поиска, блок маршрута, вторичные кнопки, сгруппированные списки, плитки. */
  subtle: string;
  text: string;
  /** Вторичный текст, контраст ≥ 4.5:1 на background и subtle. */
  textMuted: string;
  /** Шевроны, пунктиры — не для текста мельче 18 pt. */
  textSubtle: string;
  /** Вторичные иконки. */
  icon: string;
  /** Неактивные иконки таб-бара. */
  iconInactive: string;
  line: string;
  /** Рамки полей Android, пунктир билета. */
  lineStrong: string;
  /** Разделители строк в сгруппированных списках. */
  divider: string;
  /** Пунктир таймлайна. */
  dashed: string;
  /** Главная кнопка (CTA) — cyan в обеих темах. */
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  /** «Вес» интерфейса: активная вкладка, цены, выбранный чип. Почти чёрный; в тёмной теме — почти белый. */
  strong: string;
  onStrong: string;
  /** Рамка и галочка выбранного элемента. */
  accent: string;
  accentGlow: string;
  /** Круги иконок уведомлений, индикатор Android-навбара. */
  accentTint: string;
  accentTintStrong: string;
  /** Тёплая подложка: аватар на главном, круг за сценой онбординга. */
  warmTint: string;
  /** Подложки кругов уведомлений: проблема / доставлено. */
  dangerTint: string;
  successTint: string;
  mapBackground: string;
  /** Текст деструктивных действий («Выйти»). */
  danger: string;
  status: typeof status;
}

export const lightColors: ColorScheme = {
  background: brand.white,
  card: brand.white,
  subtle: '#F4F6F8',
  text: brand.ink,
  // В макетах #6B7685, но на subtle это 4.26:1 — чуть темнее, чтобы держать AA и на сером блоке.
  textMuted: '#677281',
  textSubtle: '#8A94A3',
  icon: '#4A5565',
  iconInactive: '#4A5565',
  line: '#EEF0F3',
  lineStrong: '#DDE1E6',
  divider: 'rgba(14,24,38,0.06)',
  dashed: '#B9C1CB',
  primary: brand.cyan,
  primaryPressed: brand.cyanPressed,
  onPrimary: brand.ink,
  strong: brand.ink,
  onStrong: brand.white,
  accent: brand.cyan,
  accentGlow: brand.cyanGlow,
  accentTint: 'rgba(34,201,224,0.16)',
  accentTintStrong: 'rgba(34,201,224,0.22)',
  warmTint: brand.apricotSoft,
  dangerTint: 'rgba(226,75,74,0.12)',
  successTint: 'rgba(18,184,134,0.14)',
  mapBackground: '#0E2A4D',
  danger: '#B3302F',
  status,
};

// Тёмная тема (DESIGN-TZ 2.3): CTA остаётся cyan с тёмным текстом, «вес» — почти белый.
// Контраст пар проверяет тест __tests__/tokens.test.ts.
export const darkColors: ColorScheme = {
  background: brand.ink,
  card: '#16233A',
  subtle: '#1E2D47',
  text: '#F1F5F9',
  textMuted: '#A3B1C2',
  textSubtle: '#7D8BA0',
  icon: '#A3B1C2',
  iconInactive: '#A3B1C2',
  line: '#2A3A55',
  lineStrong: '#3A4C6A',
  divider: 'rgba(255,255,255,0.08)',
  dashed: '#3A4C6A',
  primary: brand.cyan,
  primaryPressed: brand.cyanPressed,
  onPrimary: brand.ink,
  strong: '#F1F5F9',
  onStrong: brand.ink,
  accent: brand.cyan,
  accentGlow: brand.cyanGlow,
  accentTint: 'rgba(34,201,224,0.18)',
  accentTintStrong: 'rgba(34,201,224,0.26)',
  warmTint: 'rgba(244,177,131,0.18)',
  dangerTint: 'rgba(226,75,74,0.18)',
  successTint: 'rgba(18,184,134,0.2)',
  mapBackground: '#0B1F3A',
  danger: '#F07A79',
  status,
};

/** Стекло (DESIGN-TZ 2.2): BlurView + фолбэк, если размытие недоступно или «уменьшить прозрачность». */
export const glass = {
  light: {
    tint: 'light',
    intensity: 60,
    fallback: 'rgba(255,255,255,0.92)',
    overlay: 'rgba(255,255,255,0.72)',
    border: 'rgba(14,24,38,0.06)',
  },
  dark: {
    tint: 'dark',
    intensity: 60,
    fallback: 'rgba(22,35,58,0.94)',
    overlay: 'rgba(22,35,58,0.72)',
    border: 'rgba(255,255,255,0.08)',
  },
  onDark: {
    tint: 'dark',
    intensity: 40,
    fallback: 'rgba(14,42,77,0.85)',
    overlay: 'rgba(255,255,255,0.14)',
    border: 'rgba(255,255,255,0.22)',
  },
  /** Затемнение под нижним листом. */
  scrim: 'rgba(14,24,38,0.28)',
} as const;

/** Текст и линии на тёмно-синем фоне (схема трекинга) — одинаковы в обеих темах. */
export const onDark = {
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.82)',
  track: 'rgba(255,255,255,0.3)',
} as const;

export type GlassVariant = 'light' | 'dark' | 'onDark';

export const fonts = {
  // Один шрифт — Inter (DESIGN-TZ 2.4). Space Grotesk — только словесный знак «novex».
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  display: 'Inter_700Bold',
  wordmark: 'SpaceGrotesk_700Bold',
} as const;

/** Трекинг в pt из em: letterSpacing = fontSize × em. */
const track = (fontSize: number, em: number) => Math.round(fontSize * em * 100) / 100;

export const typography = {
  /** Заголовки вкладок. */
  largeTitle: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: track(30, -0.035),
  },
  /** Онбординг, «Заказ оформлен», статус на трекинге. */
  hero: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 44, letterSpacing: track(40, -0.045) },
  /** Коды городов ALA / NQZ. */
  codeSm: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: track(22, -0.03),
  },
  code: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: track(28, -0.03),
  },
  codeLg: {
    fontFamily: fonts.extrabold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: track(36, -0.03),
  },
  /** Имя в профиле, заголовки листов. */
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 24, letterSpacing: track(20, -0.02) },
  /** «Что отправляете», «Статус доставки». */
  section: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: track(16, -0.01),
  },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  /** Цена в списке; итог — priceLarge. Цвет — navy. */
  price: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, letterSpacing: track(17, -0.02) },
  priceLarge: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: track(22, -0.02),
  },
  /** Подписи полей, вторичный текст. */
  label: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  /** «СЕЙЧАС» на карте — с textTransform: 'uppercase'. */
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: track(13, 0.08),
  },
  /** Устаревшие варианты (были до v2) — оставлены, пока на них есть ссылки. */
  display: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: track(32, -0.035),
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: track(20, -0.02),
  },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Сетка 4/8. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Боковые поля экрана: iOS 20, Android 16. */
export const screenPadding = Platform.OS === 'android' ? 16 : 20;

export const radii = {
  input: 12,
  tile: 16,
  group: 18,
  card: 20,
  sheet: 28,
  badge: 8,
  pill: 999,
  button: 999,
} as const;

export const sizes = {
  /** Главная кнопка; на онбординге и экране успеха — buttonHeightLarge. */
  buttonHeight: 54,
  buttonHeightLarge: 56,
  /** Минимальная область нажатия: iOS 44, Android 48. */
  hitTarget: Platform.OS === 'android' ? 48 : 44,
  inputHeight: Platform.OS === 'android' ? 56 : 54,
  /** Плавающий таб-бар iOS и его активный круг. */
  navBar: 64,
  navItem: 48,
  /** Таб-бар Android на всю ширину. */
  navBarAndroid: 72,
  tabIcon: 22,
} as const;

/** Анимации (DESIGN-TZ 7); при «уменьшить движение» — без анимации. */
export const motion = {
  press: 120,
  fast: 150,
  normal: 200,
  slow: 250,
  sheet: 300,
  progress: 500,
} as const;

export const shadows = {
  /** Активный сегмент переключателя. */
  raised: '0 1px 3px rgba(14,24,38,0.12)',
  /** Карточки-билеты. */
  ticket: '0 4px 14px rgba(14,24,38,0.04)',
  /** Плавающий таб-бар. */
  floating: '0 12px 32px rgba(14,24,38,0.14)',
  /** Маркеры на карте. */
  marker: '0 6px 16px rgba(0,0,0,0.35)',
  /** Белая круглая кнопка «поменять» на сером блоке. */
  button: '0 2px 8px rgba(14,24,38,0.12)',
  card: {
    shadowColor: brand.ink,
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
