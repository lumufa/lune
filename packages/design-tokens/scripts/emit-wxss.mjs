import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const repoRoot = resolve(pkgRoot, "..", "..");
const tokensPath = resolve(pkgRoot, "tokens.json");
const outPath = resolve(repoRoot, "apps/miniapp/src/styles/tokens.wxss");

const tokens = JSON.parse(readFileSync(tokensPath, "utf8"));
const { color, radius, spacing, typography, shadow } = tokens;
const semantic = color.semantic;

const HEADER = `/* AUTO-GENERATED from packages/design-tokens/tokens.json */
/* Do not edit by hand. Run \`npm run emit:wxss\` from packages/design-tokens to refresh. */
/* Lengths are emitted in rpx (= logical px * 2). */

`;

const rpx = (n) => `${n * 2}rpx`;

function emitSemanticColors() {
  const lines = Object.entries(semantic).map(
    ([k, v]) => `  --${kebab(k)}: ${v};`
  );
  return lines;
}

function emitLegacyAliases() {
  return [
    `  --pink: ${semantic.accent};`,
    `  --pink-soft: ${semantic.accentGradientTo};`,
    `  --ink-2: ${semantic.inkSecondary};`,
    `  --muted-2: ${semantic.mutedSoft};`,
    `  --bg-dim: ${semantic.pinkMist};`,
    `  --radius-xl: 28rpx;`,
    `  --radius-lg: 24rpx;`,
    `  --radius-md: 20rpx;`,
    `  --radius-sm: 16rpx;`
  ];
}

function emitRadius() {
  return Object.entries(radius).map(
    ([k, v]) => `  --radius-${kebab(k)}: ${v >= 999 ? "9999rpx" : rpx(v)};`
  );
}

function emitSpacing() {
  return Object.entries(spacing).map(
    ([k, v]) => `  --space-${kebab(k)}: ${rpx(v)};`
  );
}

function emitFontSize() {
  return Object.entries(typography.size).map(
    ([k, v]) => `  --font-${kebab(k)}: ${rpx(v)};`
  );
}

function emitShadow() {
  return Object.entries(shadow).map(
    ([k, s]) =>
      `  --shadow-${kebab(k)}: ${rpx(s.x)} ${rpx(s.y)} ${rpx(s.blur)} ${s.color};`
  );
}

function kebab(s) {
  return s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace(/^-/, "");
}

const rootVars = [
  "/* Semantic colors */",
  ...emitSemanticColors(),
  "",
  "/* Radius */",
  ...emitRadius(),
  "",
  "/* Spacing (rpx) */",
  ...emitSpacing(),
  "",
  "/* Typography size (rpx) */",
  ...emitFontSize(),
  "",
  "/* Shadows */",
  ...emitShadow(),
  "",
  "/* Legacy aliases (miniapp; last so they override canonical values) */",
  ...emitLegacyAliases()
];

const css = `page {\n${rootVars.join("\n")}\n}\n`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, HEADER + css, "utf8");

console.log(`✓ emitted ${outPath}`);
