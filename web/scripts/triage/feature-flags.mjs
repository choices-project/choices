#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const ROOT = path.resolve(".");
const FLAG_FILE = path.resolve("lib/core/feature-flags.ts");

const text = fs.readFileSync(FLAG_FILE, "utf8");
const flagMatches = [...text.matchAll(/FEATURE_FLAGS\s*=\s*{([\s\S]*?)}/gm)];
const flags = new Set();
if (flagMatches[0]) {
  for (const m of flagMatches[0][1].matchAll(/([A-Z0-9_]+)\s*:/g)) flags.add(m[1]);
}

const exts = /\.(ts|tsx|js|jsx)$/;
const used = new Set();
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (["node_modules",".next","dist"].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (exts.test(e.name)) {
      const s = fs.readFileSync(p, "utf8");
      for (const m of s.matchAll(/isFeatureEnabled\(['"`]([A-Za-z0-9_\-]+)['"`]\)/g)) used.add(m[1]);
    }
  }
}
walk(ROOT);

const out = path.resolve("_reports/feature-flags.json");
fs.writeFileSync(out, JSON.stringify({
  defined: [...flags],
  used: [...used],
  missingInDefined: [...used].filter(u => !flags.has(u)),
  unusedFlags: [...flags].filter(f => !used.has(f))
}, null, 2));
console.log(`Wrote ${out}`);
