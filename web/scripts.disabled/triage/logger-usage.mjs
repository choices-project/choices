#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const exts = /\.(ts|tsx|js|jsx)$/;
const calls = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next" || e.name === "dist") continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (exts.test(e.name)) {
      const s = fs.readFileSync(p, "utf8");
      const importDevLog = /from\s+['"]@\/lib\/logger['"]/;
      if (!importDevLog.test(s)) continue;
      const re = /devLog\s*\(([^)]*)\)/g;
      let m; 
      while ((m = re.exec(s))) {
        const inside = m[1];
        const arity = inside.trim() ? (inside.split(",").length) : 0;
        calls.push({ file: p.replace(ROOT + "/", ""), arity, snippet: `devLog(${inside.slice(0,120)}${inside.length>120?'…':''})` });
      }
    }
  }
}
walk(ROOT);
const out = path.resolve("_reports/logger-usage.json");
fs.writeFileSync(out, JSON.stringify({
  byArity: Object.groupBy ? Object.groupBy(calls, x=>x.arity) : calls.reduce((acc,x)=>((acc[x.arity]=acc[x.arity]||[]).push(x),acc),{}),
  total: calls.length
}, null, 2));
console.log(`Wrote ${out}`);
