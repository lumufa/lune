import { Platform } from "react-native";
import {
  colors as luneColors,
  palette as lunePalette,
  radius as luneRadius,
  spacing as luneSpacing,
  typography as luneTypography,
  shadow as luneShadow,
  motion as luneMotion,
  component as luneComponent
} from "@women-period/design-tokens";

// Canonical Lune tokens (pink palette extracted from miniapp).
// New screens should import these directly.
export const tokens = {
  colors: luneColors,
  palette: lunePalette,
  radius: luneRadius,
  spacing: luneSpacing,
  typography: luneTypography,
  shadow: luneShadow,
  motion: luneMotion,
  component: luneComponent
} as const;

export {
  luneColors,
  lunePalette,
  luneRadius,
  luneSpacing,
  luneTypography,
  luneShadow,
  luneMotion,
  luneComponent
};

// Legacy runtime tokens (brown theme) kept for screens that haven't been refreshed.
export const colors = {
  background: "#f8f6f3",
  surface: "#ffffff",
  surfaceMuted: "#f5f4f1",
  border: "#e7e5e4",
  text: "#1c1917",
  textMuted: "#78716c",
  accent: "#8a5a3c",
  accentSoft: "#efe6df",
  success: "#166534",
  danger: "#b42318",
  white: "#ffffff"
} as const;

// figma* surface keeps existing names for backward compatibility, but values now
// resolve through the canonical Lune palette so 115+ callsites pick up the new
// pink design without touching every screen.
export const figmaColors = {
  primary: luneColors.accent,
  primaryHover: luneColors.accentPress,
  primaryPressed: luneColors.accentDeep,
  primaryDisabled: luneColors.pinkPale,
  accent: luneColors.accent,
  accentHover: luneColors.accentPress,
  accentPressed: luneColors.accentDeep,
  accentDisabled: luneColors.pinkBorder,
  success: "#2ECC71",
  warning: luneColors.warning,
  period: luneColors.accent,
  surface: luneColors.surface,
  surfaceMuted: luneColors.surfaceSunken,
  textPrimary: luneColors.ink,
  textSecondary: luneColors.muted,
  iconDefault: luneColors.ink,
  iconMuted: luneColors.muted,
  divider: luneColors.line,
  white: lunePalette.neutral["0"],
  floCanvas: luneColors.bg,
  floHero: luneColors.pinkMist,
  floHeroDeep: luneColors.pinkPale,
  floHeroSoft: luneColors.pinkMist,
  floInk: luneColors.ink,
  floMuted: luneColors.muted,
  floBorder: luneColors.line,
  floPink: luneColors.accent,
  floPinkDeep: luneColors.accentPress,
  floPinkSoft: luneColors.pinkPale,
  floBlueCard: "#B7D6F6",
  floPeachCard: "#F2D2BF",
  floMintCard: "#DCEAE7",
  floLilacCard: "#E4D3EF",
  floDarkCard: luneColors.inkSecondary
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40
} as const;

export const figmaSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999
} as const;

export const figmaRadii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999
} as const;

export const figmaTypography = {
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "600"
  },
  heading: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "500"
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600"
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400"
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600"
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "400"
  },
  captionStrong: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600"
  }
} as const;

export const figmaLayout = {
  pagePaddingHorizontal: 20,
  pagePaddingTop: 56,
  pagePaddingBottom: 60,
  sectionGap: 24,
  cardGap: 16,
  inlineGap: 12,
  topNavHeight: 56,
  bottomNavHeight: 60,
  featureCardHeight: 120,
  dataCardHeight: 180,
  minTouchTarget: 44
} as const;

export const figmaComponents = {
  button: {
    height: 48,
    minWidth: 120,
    miniHeight: 32,
    borderRadius: 16,
    miniBorderRadius: 12
  },
  input: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16
  },
  tag: {
    height: 24,
    borderRadius: 8,
    paddingHorizontal: 12
  },
  card: {
    borderRadius: 16,
    padding: 16,
    paddingLarge: 24
  },
  nav: {
    iconSize: 24,
    itemCount: 4
  }
} as const;

export const figmaMotion = {
  feedbackMs: 100,
  pageTransitionMs: 200,
  modalTransitionMs: 200,
  cardLiftMs: 200,
  chartEnterMs: 500,
  statusTransitionMs: 300,
  pressScale: 0.98,
  cardLiftOffset: 2
} as const;

export const figmaShadows = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2
    }
  },
  cardHover: {
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4
    }
  }
} as const;

export const shadows = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 6
    }
  },
  android: {
    elevation: 3
  },
  default: {}
});

export const figmaTokens = {
  colors: figmaColors,
  spacing: figmaSpacing,
  radii: figmaRadii,
  typography: figmaTypography,
  layout: figmaLayout,
  components: figmaComponents,
  motion: figmaMotion,
  shadows: figmaShadows
} as const;
