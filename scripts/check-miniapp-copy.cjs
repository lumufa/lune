const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "apps", "miniapp", "src");
const extensions = new Set([".ts", ".wxml", ".wxss", ".json"]);
const suspiciousFragments = [
  "缁",
  "鏃",
  "鍛",
  "闅",
  "璁",
  "銆",
  "鈫",
  "锛",
  "鏈",
  "鍒",
  "鎻",
  "娲",
  "寮",
  "绋",
  "鐤",
  "棰",
  "璺",
  "鎺",
  "褰",
  "姝",
  "鍏",
  "鍙",
  "鏌",
  "鐭"
];

const failures = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.isFile() || !extensions.has(path.extname(entry.name))) {
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");

    if (path.extname(entry.name) === ".json" && content.charCodeAt(0) === 0xfeff) {
      failures.push({
        file: fullPath,
        reason: "JSON file contains BOM"
      });
    }

    for (const fragment of suspiciousFragments) {
      if (content.includes(fragment)) {
        failures.push({
          file: fullPath,
          reason: `Suspicious mojibake fragment: ${fragment}`
        });
        break;
      }
    }
  }
}

walk(root);

if (failures.length) {
  console.error("Miniapp copy check failed:");
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.reason}`);
  }
  process.exit(1);
}

console.log("Miniapp copy check passed.");
