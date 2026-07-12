/**
 * Evently design tokens — single source of truth for the "Elegance & Ease" theme.
 *
 * Ported verbatim from the Stitch screen exports (warm sage / champagne palette).
 * NOTE: these values are mirrored in `tailwind.config.js` for NativeWind className
 * usage. If you change a color here, change it there too (see CONTRACT.md §Theme).
 *
 * Use `palette[...]` for programmatic styling (icon colors, charts, print HTML,
 * StatusBar). Use NativeWind classes (`bg-primary`, `text-on-surface`, ...) in JSX.
 */

export const palette = {
  // Brand
  primary: '#596244',
  'on-primary': '#ffffff',
  'primary-container': '#8e9775',
  'on-primary-container': '#272f15',
  'primary-fixed': '#dee7c0',
  'primary-fixed-dim': '#c1cba6',
  'on-primary-fixed': '#171e06',
  'on-primary-fixed-variant': '#424a2e',
  'inverse-primary': '#c1cba6',
  'surface-tint': '#596244',

  // Secondary (warm brown)
  secondary: '#7d562d',
  'on-secondary': '#ffffff',
  'secondary-container': '#ffca98',
  'on-secondary-container': '#7a532a',
  'secondary-fixed': '#ffdcbd',
  'secondary-fixed-dim': '#f0bd8b',
  'on-secondary-fixed': '#2c1600',
  'on-secondary-fixed-variant': '#623f18',

  // Tertiary (gold)
  tertiary: '#765a05',
  'on-tertiary': '#ffffff',
  'tertiary-container': '#b08f3b',
  'on-tertiary-container': '#392a00',
  'tertiary-fixed': '#ffdf96',
  'tertiary-fixed-dim': '#e7c268',
  'on-tertiary-fixed': '#251a00',
  'on-tertiary-fixed-variant': '#5a4400',

  // Error
  error: '#ba1a1a',
  'on-error': '#ffffff',
  'error-container': '#ffdad6',
  'on-error-container': '#93000a',

  // Surfaces & background
  background: '#fcf9f8',
  'on-background': '#1b1c1c',
  surface: '#fcf9f8',
  'on-surface': '#1b1c1c',
  'surface-dim': '#dcd9d9',
  'surface-bright': '#fcf9f8',
  'surface-container-lowest': '#ffffff',
  'surface-container-low': '#f6f3f2',
  'surface-container': '#f0eded',
  'surface-container-high': '#eae7e7',
  'surface-container-highest': '#e4e2e1',
  'surface-variant': '#e4e2e1',
  'on-surface-variant': '#46483f',
  'inverse-surface': '#303030',
  'inverse-on-surface': '#f3f0f0',

  // Lines
  outline: '#77786e',
  'outline-variant': '#c7c7bb',
} as const;

export type ColorName = keyof typeof palette;

/** Resolve a token name to a hex string (for programmatic use). */
export const color = (name: ColorName): string => palette[name];

/** Spacing scale (px). NativeWind also exposes these as tailwind spacing. */
export const spacing = {
  base: 8,
  gutter: 24,
  'section-gap': 64,
  'container-padding-mobile': 20,
  'container-padding-desktop': 80,
} as const;

/** Border radii (px). */
export const radius = {
  DEFAULT: 4,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
} as const;

export const fonts = {
  /** Hanken Grotesk — headlines. Keys match @expo-google-fonts/hanken-grotesk. */
  headline: {
    regular: 'HankenGrotesk_400Regular',
    medium: 'HankenGrotesk_500Medium',
    semibold: 'HankenGrotesk_600SemiBold',
    bold: 'HankenGrotesk_700Bold',
  },
  /** Inter — body & labels. Keys match @expo-google-fonts/inter. */
  body: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
} as const;

/**
 * Typography presets (fontFamily + size + lineHeight + letterSpacing).
 * Mirror of the Stitch fontSize/fontFamily config. Prefer the <Text variant>
 * component (see CONTRACT.md) over reaching for these directly.
 */
export const typography = {
  'headline-xl': { fontFamily: fonts.headline.bold, fontSize: 48, lineHeight: 56, letterSpacing: -0.96 },
  'headline-xl-mobile': { fontFamily: fonts.headline.semibold, fontSize: 32, lineHeight: 40, letterSpacing: -0.32 },
  'headline-lg': { fontFamily: fonts.headline.medium, fontSize: 32, lineHeight: 40, letterSpacing: 0 },
  'headline-md': { fontFamily: fonts.headline.medium, fontSize: 24, lineHeight: 32, letterSpacing: 0 },
  'headline-sm': { fontFamily: fonts.headline.medium, fontSize: 20, lineHeight: 28, letterSpacing: 0 },
  'body-lg': { fontFamily: fonts.body.regular, fontSize: 18, lineHeight: 28, letterSpacing: 0 },
  'body-md': { fontFamily: fonts.body.regular, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  'body-sm': { fontFamily: fonts.body.regular, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  'label-md': { fontFamily: fonts.body.medium, fontSize: 14, lineHeight: 16, letterSpacing: 0.14 },
  'label-sm': { fontFamily: fonts.body.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.48 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Soft ambient shadows used by cards/buttons (4–8% opacity, see DESIGN.md). */
export const shadows = {
  card: {
    shadowColor: '#2d2d2d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 30,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#2d2d2d',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 6,
  },
  float: {
    shadowColor: '#2d2d2d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  hero: {
    shadowColor: '#2d2d2d',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 50,
    elevation: 8,
  },
} as const;
