#!/usr/bin/env node
import { readFileSync } from "fs";
import { execSync } from "child_process";

const policy = JSON.parse(readFileSync("policy/endpoint-policy.json","utf8"));
const base = process.env.BASE_SHA, head = process.env.HEAD_SHA;
const changed = execSync(`git diff --name-only ${base}...${head}`).toString().trim().split("\n").filter(Boolean);

const apiFiles = changed.filter(f => f.startsWith("apps/web/app/api/"));
if (!apiFiles.length) process.exit(0);

let fail = false;
for (const f of apiFiles) {
  if (!Object.keys(policy.minTrust).some(k => f.endsWith(k))) {
    console.error(`::error file=${f}::Missing trust policy entry in policy/endpoint-policy.json`);
    fail = true; continue;
  }
  const text = readFileSync(f, "utf8");
  const line = text.split("\n").find(l => l.includes("@minTrust:"));
  if (!line) {
    console.error(`::error file=${f}::Add file header comment like: // @minTrust: ${policy.minTrust[Object.keys(policy.minTrust).find(k=>f.endsWith(k))]}`);
    fail = true;
  }
}
process.exit(fail ? 1 : 0);
