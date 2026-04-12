const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const miniappRoot = path.join(__dirname, "..", "apps", "miniapp", "src");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.isFile() || !fullPath.endsWith(".ts") || fullPath.endsWith(".d.ts")) {
      continue;
    }

    const source = fs.readFileSync(fullPath, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2019,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        esModuleInterop: true,
        strict: false,
        sourceMap: false,
        removeComments: false
      },
      fileName: fullPath
    });

    const outputPath = fullPath.replace(/\.ts$/, ".js");
    fs.writeFileSync(outputPath, output.outputText, "utf8");
  }
}

walk(miniappRoot);
console.log("Miniapp runtime JS generated in apps/miniapp/src");
