// Единственный источник цветов, шрифтов, отступов и анимаций (ТЗ 4, правило 3; ТЗ 6.1).

const brand = {
  navy: '#0B2545',
  navyPressed: '#0E2E5C',
  cyan: '#22C9E0',
  cyanGlow: 'rgba(34,201,224,0.18)',
  steel: '#3E6E8A',
  cloud: '#F1F5F9',
  ink: '#0E1826',
  muted: '#5F6E7E',
  line: '#E2E8EE',
  white: '#FFFFFF',
} as const;

/** Цвета знака Novex — одинаковые в обеих темах. */
export const logoColors = { node: brand.cyan, branch: brand.steel } as const;

const status = {
  neutral: '#8FA3B2',
  transit: '#F5A623',
  danger: '#E24B4A',
  success: '#12B886',
} as const;

export interface ColorScheme {
  background: string;
  card: string;
  subtle: string;
  text: string;
  textMuted: string;
  line: string;
  icon: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  accent: string;
  accentGlow: string;
  status: typeof status;
}

export const lightColors: ColorScheme = {
  background: '#FAFAFA',
  card: brand.white,
  subtle: brand.cloud,
  text: brand.ink,
  textMuted: brand.muted,
  line: brand.line,
  icon: brand.steel,
  primary: brand.navy,
  primaryPressed: brand.navyPressed,
  onPrimary: brand.white,
  accent: brand.cyan,
  accentGlow: brand.cyanGlow,
  status,
};

// Тёмная тема: фон ink, карточки чуть светлее, cyan — акцент. Контраст текста ≥ AA.
// Главная кнопка в тёмной теме — cyan с тёмным текстом: navy на тёмном фоне не читается.
export const darkColors: ColorScheme = {
  background: brand.ink,
  card: '#16233A',
  subtle: '#1E2D47',
  text: '#F1F5F9',
  textMuted: '#A3B1C2',
  line: '#2A3A55',
  icon: '#8FB3C9',
  primary: brand.cyan,
  primaryPressed: '#1AB3C8',
  onPrimary: brand.ink,
  accent: brand.cyan,
  accentGlow: brand.cyanGlow,
  status,
};

export const fonts = {
  // Space Grotesk — заголовки и цены от 24 pt; Inter — весь интерфейс до 20 pt.
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

export const typography = {
  /** Статус на экране трекинга — главный элемент «скриншотного» экрана. */
  hero: { fontFamily: fonts.display, fontSize: 44, lineHeight: 50, letterSpacing: -0.5 },
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
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

export const radii = {
  button: 12,
  card: 16,
  badge: 8,
  pill: 999,
} as const;

export const sizes = {
  /** Главная кнопка — от 48 pt. */
  buttonHeight: 52,
  /** Минимальная область нажатия — 44×44 pt. */
  hitTarget: 44,
  tabIcon: 24,
} as const;

/** Анимации 150–250 мс (ТЗ 6.5); при «уменьшить движение» — без анимации. */
export const motion = {
  fast: 150,
  normal: 200,
  slow: 250,
} as const;

export const shadows = {
  /** Активный сегмент переключателя. */
  raised: '0 1px 3px rgba(14,24,38,0.12)',
  card: {
    shadowColor: brand.ink,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
