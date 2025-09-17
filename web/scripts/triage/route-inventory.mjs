#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const APP = path.resolve("app");
const routes = [];
function walk(dir, base="/") {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    const seg = e.name.startsWith("(") ? "" : `/${e.name.replace(/\.(tsx|ts|js)$/, "")}`;
    if (e.isDirectory()) {
      walk(p, base + seg);
    } else if (/^page\.(tsx|ts|js)$/.test(e.name)) {
      routes.push({ kind: "page", path: base || "/", file: p.replace(process.cwd()+"/","") });
    } else if (/^route\.(ts|js)$/.test(e.name)) {
      routes.push({ kind: "api", path: base || "/", file: p.replace(process.cwd()+"/","") });
    }
  }
}
if (fs.existsSync(APP)) walk(APP, "");
console.log(JSON.stringify(routes, null, 2));
