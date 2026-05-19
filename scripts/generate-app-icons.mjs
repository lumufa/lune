// Regenerates every app icon asset (mobile/Expo, HarmonyOS, miniapp) from a
// single authoritative SVG. Run with `node scripts/generate-app-icons.mjs`.
//
// sharp is installed ad-hoc under C:/tmp/svg-render/node_modules to avoid the
// workspace:* protocol conflict at the repo root; resolve() falls back to that
// if the workspace copy isn't available.
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve as pathResolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require("sharp");
} catch {
  sharp = require("C:/tmp/svg-render/node_modules/sharp");
}

const repoRoot = pathResolve(fileURLToPath(import.meta.url), "..", "..");

const PINK = "#FF6B81";
const CREAM = "#FFF0F0";

// Final design (2026-04): large crescent lowered + 5 stars arcing down the
// right side (光轨). Crescent outer cx=460 cy=548 r=318, cutout cx=588 cy=486
// r=266. Stars decrease in size and opacity top→bottom.
// Content bbox x 142–930 (=788), y 155–866 (=711), center (536, 510.5).
const CONTENT_ELEMENTS = `
    <path d="M 808 200 L 823 155 L 838 200 L 883 215 L 838 230 L 823 275 L 808 230 L 763 215 Z" fill="white" opacity="0.85"/>
    <path d="M 876 325 L 885 297 L 894 325 L 922 334 L 894 343 L 885 371 L 876 343 L 848 334 Z" fill="white" opacity="0.68"/>
    <path d="M 894 500 L 901 478 L 908 500 L 930 507 L 908 514 L 901 536 L 894 514 L 872 507 Z" fill="white" opacity="0.55"/>`;

const MONO_CONTENT_ELEMENTS = `
    <path d="M 808 200 L 823 155 L 838 200 L 883 215 L 838 230 L 823 275 L 808 230 L 763 215 Z" fill="white"/>
    <path d="M 876 325 L 885 297 L 894 325 L 922 334 L 894 343 L 885 371 L 876 343 L 848 334 Z" fill="white"/>
    <path d="M 894 500 L 901 478 L 908 500 L 930 507 L 908 514 L 901 536 L 894 514 L 872 507 Z" fill="white"/>`;

// Content bbox: x [266, 899] = 633, y [128, 919] = 791, center (582.5, 523.5).
// Launchers apply a rounded-square/circle mask that crops ~12-15% per edge, so
// we scale the drawable content to 80% of canvas and center it. Background
// stays full-bleed so the mask shows solid pink edges.
const CONTENT_SCALE = 0.80;
const CONTENT_CX = 536;
const CONTENT_CY = 510.5;

// Transform that scales/centers content around a given canvas center (cx, cy).
const centerTransform = (cx, cy) =>
  `translate(${cx} ${cy}) scale(${CONTENT_SCALE}) translate(${-CONTENT_CX} ${-CONTENT_CY})`;

// Square icon (full-bleed background; OS/shell applies corner mask).
const squareSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${PINK}"/>
  <g transform="${centerTransform(512, 512)}">
    <mask id="crescent" maskUnits="userSpaceOnUse">
      <rect x="-500" y="-500" width="2024" height="2024" fill="black"/>
      <circle cx="460" cy="548" r="318" fill="white"/>
      <circle cx="588" cy="486" r="266" fill="black"/>
    </mask>
    <rect x="-500" y="-500" width="2024" height="2024" fill="${CREAM}" mask="url(#crescent)"/>
${CONTENT_ELEMENTS}
  </g>
</svg>`;

// Rounded icon (rx=228) — splash logo drawable (no OS mask, so bake in corners).
const roundedSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="228" fill="${PINK}"/>
  <g transform="${centerTransform(512, 512)}">
    <mask id="crescent-r" maskUnits="userSpaceOnUse">
      <rect x="-500" y="-500" width="2024" height="2024" fill="black"/>
      <circle cx="460" cy="548" r="318" fill="white"/>
      <circle cx="588" cy="486" r="266" fill="black"/>
    </mask>
    <rect x="-500" y="-500" width="2024" height="2024" fill="${CREAM}" mask="url(#crescent-r)"/>
${CONTENT_ELEMENTS}
  </g>
</svg>`;

// Adaptive-icon foreground: transparent bg, same content placed on 984 canvas
// (adaptive icon 108dp safe zone is 66%). Also scaled to 0.80 for extra margin.
const foregroundSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 984 984">
  <g transform="${centerTransform(492, 492)}">
    <mask id="crescent-fg" maskUnits="userSpaceOnUse">
      <rect x="-500" y="-500" width="2024" height="2024" fill="black"/>
      <circle cx="460" cy="548" r="318" fill="white"/>
      <circle cx="588" cy="486" r="266" fill="black"/>
    </mask>
    <rect x="-500" y="-500" width="2024" height="2024" fill="${CREAM}" mask="url(#crescent-fg)"/>
${CONTENT_ELEMENTS}
  </g>
</svg>`;

// Themed monochrome: all-white silhouette, transparent bg, same placement.
const monochromeSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 984 984">
  <g transform="${centerTransform(492, 492)}">
    <mask id="crescent-mono" maskUnits="userSpaceOnUse">
      <rect x="-500" y="-500" width="2024" height="2024" fill="black"/>
      <circle cx="460" cy="548" r="318" fill="white"/>
      <circle cx="588" cy="486" r="266" fill="black"/>
    </mask>
    <rect x="-500" y="-500" width="2024" height="2024" fill="white" mask="url(#crescent-mono)"/>
${MONO_CONTENT_ELEMENTS}
  </g>
</svg>`;

// Solid pink panel used as the adaptive-icon background PNG (Android also reads
// @color/iconBackground, but Expo's asset pipeline keeps this file in sync).
const backgroundSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${PINK}"/></svg>`;

async function render(svg, outPath, size) {
  await mkdir(dirname(outPath), { recursive: true });
  const png = await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(outPath, png);
  return outPath;
}

const targets = [
  // Mobile (Expo) asset sources
  { kind: "square", size: 1024, out: "apps/mobile/assets/images/haven-icon.png" },
  { kind: "square", size: 1024, out: "apps/mobile/assets/images/haven-splash-icon.png" },
  { kind: "square", size: 48, out: "apps/mobile/assets/images/haven-favicon.png" },
  { kind: "foreground", size: 512, out: "apps/mobile/assets/images/haven-android-icon-foreground.png" },
  { kind: "monochrome", size: 432, out: "apps/mobile/assets/images/haven-android-icon-monochrome.png" },
  { kind: "background", size: 512, out: "apps/mobile/assets/images/haven-android-icon-background.png" },
  // Legacy Expo asset names (still referenced as fallbacks in some tooling)
  { kind: "square", size: 1024, out: "apps/mobile/assets/images/icon.png" },
  { kind: "square", size: 1024, out: "apps/mobile/assets/images/splash-icon.png" },
  { kind: "square", size: 48, out: "apps/mobile/assets/images/favicon.png" },
  { kind: "foreground", size: 512, out: "apps/mobile/assets/images/android-icon-foreground.png" },
  { kind: "monochrome", size: 432, out: "apps/mobile/assets/images/android-icon-monochrome.png" },
  { kind: "background", size: 512, out: "apps/mobile/assets/images/android-icon-background.png" },

  // Android generated mipmaps (prebuild output, checked in)
  { kind: "square", size: 48, out: "apps/mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher.png" },
  { kind: "square", size: 72, out: "apps/mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher.png" },
  { kind: "square", size: 96, out: "apps/mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png" },
  { kind: "square", size: 144, out: "apps/mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png" },
  { kind: "square", size: 192, out: "apps/mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" },

  { kind: "square", size: 48, out: "apps/mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png" },
  { kind: "square", size: 72, out: "apps/mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png" },
  { kind: "square", size: 96, out: "apps/mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png" },
  { kind: "square", size: 144, out: "apps/mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png" },
  { kind: "square", size: 192, out: "apps/mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png" },

  { kind: "foreground", size: 108, out: "apps/mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png" },
  { kind: "foreground", size: 162, out: "apps/mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png" },
  { kind: "foreground", size: 216, out: "apps/mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png" },
  { kind: "foreground", size: 324, out: "apps/mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png" },
  { kind: "foreground", size: 432, out: "apps/mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png" },

  { kind: "monochrome", size: 108, out: "apps/mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher_monochrome.png" },
  { kind: "monochrome", size: 162, out: "apps/mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher_monochrome.png" },
  { kind: "monochrome", size: 216, out: "apps/mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher_monochrome.png" },
  { kind: "monochrome", size: 324, out: "apps/mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_monochrome.png" },
  { kind: "monochrome", size: 432, out: "apps/mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_monochrome.png" },

  // Android splash drawables (bitmap centered on white bg; not masked by OS)
  { kind: "rounded", size: 288, out: "apps/mobile/android/app/src/main/res/drawable-mdpi/splashscreen_logo.png" },
  { kind: "rounded", size: 432, out: "apps/mobile/android/app/src/main/res/drawable-hdpi/splashscreen_logo.png" },
  { kind: "rounded", size: 576, out: "apps/mobile/android/app/src/main/res/drawable-xhdpi/splashscreen_logo.png" },
  { kind: "rounded", size: 864, out: "apps/mobile/android/app/src/main/res/drawable-xxhdpi/splashscreen_logo.png" },
  { kind: "rounded", size: 1152, out: "apps/mobile/android/app/src/main/res/drawable-xxxhdpi/splashscreen_logo.png" },

  // HarmonyOS
  { kind: "square", size: 114, out: "apps/harmony/entry/src/main/resources/base/media/icon.png" },
  { kind: "square", size: 114, out: "apps/harmony/AppScope/resources/base/media/app_icon.png" },

  // Miniapp
  { kind: "square", size: 1024, out: "apps/miniapp/src/assets/haven-icon.png" }
];

const svgFor = {
  square: squareSvg,
  rounded: roundedSvg,
  foreground: foregroundSvg,
  monochrome: monochromeSvg,
  background: backgroundSvg
};

const results = [];
for (const t of targets) {
  const abs = pathResolve(repoRoot, t.out);
  await render(svgFor[t.kind](t.size), abs, t.size);
  results.push(`${t.kind.padEnd(11)} ${String(t.size).padStart(4)} → ${t.out}`);
}
console.log(results.join("\n"));
console.log(`\nGenerated ${results.length} files.`);
