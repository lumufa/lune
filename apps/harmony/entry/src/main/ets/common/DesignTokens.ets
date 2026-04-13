// AUTO-GENERATED from packages/design-tokens/tokens.json
// Do not edit by hand. Run `npm run emit:harmony` from packages/design-tokens to refresh.

export const COLORS = {
  page: '#FBF8F9',
  surface: '#FFFFFF',
  surfaceMuted: '#FFF5F7',
  surfaceSunken: '#FFF5F7',
  divider: 'rgba(0, 0, 0, 0.04)',
  textPrimary: '#1E1E2C',
  textSecondary: '#8C8C9A',
  textBody: '#5B5D67',
  primary: '#FF4D6A',
  primarySoft: '#FFE8EC',
  accent: '#FF4D6A',
  accentSoft: '#FFE8EC',
  accentPress: '#E8445D',
  accentDeep: '#D14060',
  warning: '#F2A94A',
  warningSoft: '#FFF8E1',
  period: '#FF4D6A',
  periodSoft: '#FFE8EC',
  neutralSoft: '#F5F5F5',
  floPink: '#FF4D6A',
  floPinkDeep: '#E8445D',
  floPinkSoft: '#FFE8EC',
  floPinkBorder: '#FFD6DF',
  floHero: '#FFF5F7',
  floInk: '#1E1E2C',
  floMuted: '#8C8C9A',
  floBorder: 'rgba(0, 0, 0, 0.04)',
  floCanvas: '#FBF8F9',
  symptomDot: '#7C8CF4',
  heroGlowA: 'rgba(255, 255, 255, 0.30)',
  heroGlowB: 'rgba(255, 255, 255, 0.42)',
  ringBorder: '#FFD6DF',
  danger: '#D64A3B',
  dangerLink: '#E53E3E',
  bg: '#FBF8F9',
  ink: '#1E1E2C',
  inkSecondary: '#3C3C4A',
  muted: '#8C8C9A',
  mutedSoft: '#C4C4CE',
  line: 'rgba(0, 0, 0, 0.04)',
  lineStrong: 'rgba(0, 0, 0, 0.08)',
  pinkPale: '#FFE8EC',
  pinkMist: '#FFF5F7',
  pinkBorder: '#FFD6DF',
  chipIdle: '#F5F5F5',
  chipIdleInk: '#3C3C4A'
};

export const SEMANTIC = {
  bg: '#FBF8F9',
  surface: '#FFFFFF',
  surfaceSunken: '#FFF5F7',
  ink: '#1E1E2C',
  inkSecondary: '#3C3C4A',
  inkBody: '#5B5D67',
  muted: '#8C8C9A',
  mutedSoft: '#C4C4CE',
  line: 'rgba(0, 0, 0, 0.04)',
  lineStrong: 'rgba(0, 0, 0, 0.08)',
  divider: 'rgba(0, 0, 0, 0.04)',
  accent: '#FF4D6A',
  accentPress: '#E8445D',
  accentDeep: '#D14060',
  accentSoft: 'rgba(255, 77, 106, 0.10)',
  accentGradientFrom: '#FF4D6A',
  accentGradientTo: '#FF6B82',
  pinkPale: '#FFE8EC',
  pinkMist: '#FFF5F7',
  pinkBorder: '#FFD6DF',
  danger: '#D64A3B',
  dangerLink: '#E53E3E',
  warning: '#F2A94A',
  symptomDot: '#7C8CF4',
  chipIdle: '#F5F5F5',
  chipIdleInk: '#3C3C4A',
  ringBorder: '#FFD6DF'
};

export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  screenGutter: 16,
  screenTop: 16,
  screenBottom: 60,
  ctaSpacer: 100
};

export const RADII = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  card: 20,
  hero: 28,
  pill: 9999
};

export const FONT_SIZE = {
  micro: 9,
  caption: 11,
  footnote: 12,
  metaLabel: 13,
  body: 14,
  bodyLarge: 15,
  subheading: 16,
  title: 18,
  titleLarge: 20,
  heading: 24,
  displaySmall: 26,
  displayLarge: 30,
  numberXl: 40,
  heroNumber: 56
};

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800'
};

export const SHADOWS = {
  card: { radius: 8, color: 'rgba(0, 0, 0, 0.02)', offsetX: 0, offsetY: 1 },
  cta: { radius: 36, color: 'rgba(255, 77, 106, 0.28)', offsetX: 0, offsetY: 10 },
  ctaLoud: { radius: 36, color: 'rgba(255, 77, 106, 0.32)', offsetX: 0, offsetY: 10 },
  ctaFloat: { radius: 24, color: 'rgba(255, 77, 106, 0.30)', offsetX: 0, offsetY: 8 },
  hero: { radius: 48, color: 'rgba(255, 77, 106, 0.10)', offsetX: 0, offsetY: 8 }
};

export const MOTION = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 350,
    slow: 550,
    deliberate: 700
  }
};

export const COMPONENTS = {
  button: {
    minHeightLarge: 52,
    minHeightMedium: 44,
    minHeightSmall: 30,
    radiusLarge: 52,
    radiusMedium: 18,
    radiusSmall: 9,
    paddingX: 16
  },
  chip: {
    minHeight: 36,
    minHeightCompact: 28,
    radius: 18,
    paddingX: 12
  },
  tag: {
    minHeight: 34,
    radius: 17,
    paddingX: 12
  },
  card: {
    radius: 20,
    paddingX: 16,
    paddingY: 14
  },
  calendar: {
    cellSize: 36,
    cellRadius: 18,
    dotSize: 4,
    predictedBorder: 1.5
  },
  stepper: {
    buttonSize: 36,
    buttonRadius: 18,
    numberMinWidth: 28
  },
  ring: {
    heroSize: 220,
    heroStroke: 6,
    miniSize: 44,
    miniStroke: 3
  },
  switch: {
    scale: 0.85
  }
};
