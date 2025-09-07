#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const TODAY = new Date().toISOString().slice(0,10);
const base = (()=>{ try{ return execSync("git merge-base HEAD origin/main").toString().trim(); } catch { return ""; } })();
const changed = (base ? execSync(`git diff --name-only ${base}...HEAD`) : execSync("git diff --name-only")).toString().split("\n").filter(Boolean);
const targets = changed.filter(f=>/\.(md|MD)$/.test(f)).filter(f=>
  /^(README\.md|PROJECT_.*\.md|CHANGELOG\.md|DEPLOYMENT_.*\.md|API\.md|DATABASE_.*\.md|SYSTEM_.*\.md|AUTHENTICATION_.*\.md|TRUST_.*\.md)$/.test(f) ||
  f.startsWith("docs/") || /^(CIVIC_|AI_|MISSING_|IMPLEMENTATION_).*\.(md|MD)$/.test(f) || /^technical\/|^legal\//.test(f)
);

for (const file of targets) {
  if (base && execSync(`git diff --quiet ${base}...HEAD -- "${file}"`, {stdio:['ignore','ignore','ignore']}).status === 0) continue;
  let text = readFileSync(file, "utf8");
  const hasCreated = /^Created:\s*\d{4}-\d{2}-\d{2}$/m.test(text);
  const hasUpdated = /^Last Updated:\s*\d{4}-\d{2}-\d{2}$/m.test(text);
  if (hasUpdated) text = text.replace(/^Last Updated:\s*\d{4}-\d{2}-\d{2}$/m, `Last Updated: ${TODAY}`);
  else if (hasCreated) text = text.replace(/^(Created:\s*\d{4}-\d{2}-\d{2}.*\n)/m, `$1Last Updated: ${TODAY}\n`);
  else text = `Created: ${TODAY}\nLast Updated: ${TODAY}\n` + text;
  writeFileSync(file, text, "utf8");
  console.log(`Stamped ${file}`);
}
