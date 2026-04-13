import rawTokens from "../tokens.json";

export const tokens = rawTokens;

export const color = rawTokens.color;
export const palette = {
  pink: rawTokens.color.pink,
  neutral: rawTokens.color.neutral,
  status: rawTokens.color.status,
  alpha: rawTokens.color.alpha
} as const;
export const colors = rawTokens.color.semantic;

export const radius = rawTokens.radius;
export const spacing = rawTokens.spacing;
export const typography = rawTokens.typography;
export const fontSize = rawTokens.typography.size;
export const fontWeight = rawTokens.typography.weight;
export const lineHeight = rawTokens.typography.lineHeight;
export const letterSpacing = rawTokens.typography.letterSpacing;
export const shadow = rawTokens.shadow;
export const motion = rawTokens.motion;
export const component = rawTokens.component;

export type Tokens = typeof rawTokens;
export type SemanticColor = keyof typeof rawTokens.color.semantic;
export type Radius = keyof typeof rawTokens.radius;
export type Spacing = keyof typeof rawTokens.spacing;
export type FontSize = keyof typeof rawTokens.typography.size;
export type FontWeight = keyof typeof rawTokens.typography.weight;
export type ShadowPreset = keyof typeof rawTokens.shadow;

export function toRpx(logicalPx: number): number {
  return logicalPx * 2;
}

export function toVp(logicalPx: number): number {
  return logicalPx;
}

export default tokens;
