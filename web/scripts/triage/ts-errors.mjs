#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("_reports/tsc.errors.phase3.txt");
const OUT = path.resolve("_reports/tsc.errors.phase3.summary.json");
if (!fs.existsSync(SRC)) {
  console.error("Missing _reports/tsc.errors.txt; run tsc first.");
  process.exit(1);
}
const lines = fs.readFileSync(SRC, "utf8").split("\n");
const byCode = {};
const samples = {};
for (const l of lines) {
  const m = l.match(/error TS(\d+):/);
  if (!m) continue;
  const code = "TS" + m[1];
  byCode[code] = (byCode[code] || 0) + 1;
  if (!samples[code]) {
    const file = (l.split("(")[0] || "").trim();
    samples[code] = file;
  }
}
const summary = Object.entries(byCode)
  .sort((a,b)=>b[1]-a[1])
  .map(([code,count])=>({ code, count, sample: samples[code]||null }));
fs.writeFileSync(OUT, JSON.stringify(summary, null, 2));
console.log(`Wrote ${OUT}`);
