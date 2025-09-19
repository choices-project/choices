#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const AREAS = ["app","components","features","lib","utils"];
const exts = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const edges = new Map();

function areaOf(f) {
  const rel = f.replace(ROOT+"/","");
  const top = rel.split("/")[0];
  return AREAS.includes(top) ? top : "other";
}
function addEdge(from, to) {
  const key = `${from}->${to}`;
  edges.set(key, (edges.get(key)||0)+1);
}
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules",".next","dist"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (exts.test(e.name)) {
      const s = fs.readFileSync(p, "utf8");
      const from = areaOf(p);
      for (const m of s.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const imp = m[1];
        let to = "other";
        if (imp.startsWith("@/")) {
          const seg = imp.slice(2).split("/")[0];
          to = AREAS.includes(seg) ? seg : (seg==="lib"? "lib" : "other");
        } else if (imp.startsWith("./") || imp.startsWith("../")) {
          // heuristic: resolve to area of current file
          to = from;
        }
        addEdge(from, to);
      }
    }
  }
}
walk(ROOT);

fs.mkdirSync(path.resolve("_reports"), { recursive: true });
const csv = ["from,to,count", ...[...edges.entries()].map(([k,v]) => `${k.replace("->",",")},${v}`)].join("\n");
fs.writeFileSync(path.resolve("_reports/import-graph.csv"), csv, "utf8");

const mermaidEdges = [...edges.entries()].map(([k,v]) => {
  const [f,t] = k.split("->");
  return `${f} -->|${v}| ${t}`;
}).join("\n");
fs.writeFileSync(path.resolve("_reports/import-graph.mermaid.md"), "```mermaid\ngraph LR\n"+mermaidEdges+"\n```", "utf8");
console.log("Wrote _reports/import-graph.csv and _reports/import-graph.mermaid.md");
