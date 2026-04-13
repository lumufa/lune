import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const repoRoot = resolve(pkgRoot, "..", "..");
const tokensPath = resolve(pkgRoot, "tokens.json");
const outPath = resolve(
  repoRoot,
  "apps/harmony/entry/src/main/ets/common/DesignTokens.ets"
);

const tokens = JSON.parse(readFileSync(tokensPath, "utf8"));
const { color, radius, spacing, typography, shadow, motion, component } = tokens;
const semantic = color.semantic;

const HEADER = `// AUTO-GENERATED from packages/design-tokens/tokens.json
// Do not edit by hand. Run \`npm run emit:harmony\` from packages/design-tokens to refresh.

`;

function emitColors() {
  const legacyMap = {
    page: semantic.bg,
    surface: semantic.surface,
    surfaceMuted: semantic.surfaceSunken,
    surfaceSunken: semantic.surfaceSunken,
    divider: semantic.divider,
    textPrimary: semantic.ink,
    textSecondary: semantic.muted,
    textBody: semantic.inkBody,
    primary: semantic.accent,
    primarySoft: semantic.pinkPale,
    accent: semantic.accent,
    accentSoft: semantic.pinkPale,
    accentPress: semantic.accentPress,
    accentDeep: semantic.accentDeep,
    warning: semantic.warning,
    warningSoft: "#FFF8E1",
    period: semantic.accent,
    periodSoft: semantic.pinkPale,
    neutralSoft: semantic.chipIdle,
    floPink: semantic.accent,
    floPinkDeep: semantic.accentPress,
    floPinkSoft: semantic.pinkPale,
    floPinkBorder: semantic.pinkBorder,
    floHero: semantic.pinkMist,
    floInk: semantic.ink,
    floMuted: semantic.muted,
    floBorder: semantic.line,
    floCanvas: semantic.bg,
    symptomDot: semantic.symptomDot,
    heroGlowA: color.alpha.white30,
    heroGlowB: color.alpha.white42,
    ringBorder: semantic.ringBorder,
    danger: semantic.danger,
    dangerLink: semantic.dangerLink,
    bg: semantic.bg,
    ink: semantic.ink,
    inkSecondary: semantic.inkSecondary,
    muted: semantic.muted,
    mutedSoft: semantic.mutedSoft,
    line: semantic.line,
    lineStrong: semantic.lineStrong,
    pinkPale: semantic.pinkPale,
    pinkMist: semantic.pinkMist,
    pinkBorder: semantic.pinkBorder,
    chipIdle: semantic.chipIdle,
    chipIdleInk: semantic.chipIdleInk
  };
  const lines = Object.entries(legacyMap).map(
    ([k, v]) => `  ${k}: '${v}'`
  );
  return `export const COLORS = {\n${lines.join(",\n")}\n};\n`;
}

function emitSpacing() {
  const lines = Object.entries(spacing).map(([k, v]) => {
    const key = /^[a-zA-Z_]\w*$/.test(k) ? k : `'${k}'`;
    return `  ${key}: ${v}`;
  });
  return `export const SPACING = {\n${lines.join(",\n")}\n};\n`;
}

function emitRadii() {
  const lines = Object.entries(radius).map(
    ([k, v]) => `  ${k}: ${v}`
  );
  return `export const RADII = {\n${lines.join(",\n")}\n};\n`;
}

function emitFontSize() {
  const lines = Object.entries(typography.size).map(
    ([k, v]) => `  ${k}: ${v}`
  );
  return `export const FONT_SIZE = {\n${lines.join(",\n")}\n};\n`;
}

function emitFontWeight() {
  const lines = Object.entries(typography.weight).map(
    ([k, v]) => `  ${k}: '${v}'`
  );
  return `export const FONT_WEIGHT = {\n${lines.join(",\n")}\n};\n`;
}

function emitShadows() {
  const lines = Object.entries(shadow).map(([name, s]) => {
    return `  ${name}: { radius: ${s.blur}, color: '${s.color}', offsetX: ${s.x}, offsetY: ${s.y} }`;
  });
  return `export const SHADOWS = {\n${lines.join(",\n")}\n};\n`;
}

function emitMotion() {
  const durLines = Object.entries(motion.duration).map(
    ([k, v]) => `    ${k}: ${v}`
  );
  return `export const MOTION = {\n  duration: {\n${durLines.join(",\n")}\n  }\n};\n`;
}

function emitComponents() {
  const out = [];
  for (const [group, values] of Object.entries(component)) {
    const inner = Object.entries(values)
      .map(([k, v]) => `    ${k}: ${v}`)
      .join(",\n");
    out.push(`  ${group}: {\n${inner}\n  }`);
  }
  return `export const COMPONENTS = {\n${out.join(",\n")}\n};\n`;
}

function emitSemantic() {
  const lines = Object.entries(semantic).map(
    ([k, v]) => `  ${k}: '${v}'`
  );
  return `export const SEMANTIC = {\n${lines.join(",\n")}\n};\n`;
}

const body = [
  emitColors(),
  emitSemantic(),
  emitSpacing(),
  emitRadii(),
  emitFontSize(),
  emitFontWeight(),
  emitShadows(),
  emitMotion(),
  emitComponents()
].join("\n");

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, HEADER + body, "utf8");

console.log(`✓ emitted ${outPath}`);
