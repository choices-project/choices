#!/usr/bin/env node
/**
 * Fails fast when generated API inventory drifts from the route tree, or when
 * banned doc path strings appear under web/ (historical broken pointers).
 *
 * Run from repo root: node scripts/verify-docs.mjs
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function walkRouteFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkRouteFiles(p, acc);
    else if (name === 'route.ts') acc.push(p);
  }
  return acc;
}

const apiRoot = join(root, 'web/app/api');
const routeCount = walkRouteFiles(apiRoot).length;

const invPath = join(root, 'docs/API/inventory.md');
let invText;
try {
  invText = readFileSync(invPath, 'utf8');
} catch {
  console.error('verify-docs: missing docs/API/inventory.md — run npm run docs:api-inventory');
  process.exit(1);
}

const m = invText.match(/\*\*Total route modules:\*\*\s*(\d+)/);
if (!m) {
  console.error('verify-docs: could not parse **Total route modules:** in docs/API/inventory.md');
  process.exit(1);
}

const inventoryTotal = Number.parseInt(m[1], 10);
if (inventoryTotal !== routeCount) {
  console.error(
    `verify-docs: docs/API/inventory.md claims ${inventoryTotal} route modules but ` +
      `web/app/api has ${routeCount} route.ts files. Run: npm run docs:api-inventory`,
  );
  process.exit(1);
}

const banned =
  'FEATURE_STATUS\\.md|ROADMAP_SINGLE_SOURCE|docs/TESTING/api-contract-plan';
try {
  execSync(
    `rg -n "${banned}" web --glob '!**/node_modules/**' --glob '!**/.next/**' --glob '!**/dist/**'`,
    { cwd: root, stdio: 'pipe', encoding: 'utf8' },
  );
  console.error(
    'verify-docs: disallowed documentation path references found in web/. ' +
      'Use docs/ROADMAP.md, docs/TESTING.md, or archive pointers instead.',
  );
  process.exit(1);
} catch (e) {
  const status = e && typeof e === 'object' ? e.status : undefined;
  if (status !== 1) {
    console.error('verify-docs: rg failed (install ripgrep or fix path):', e?.message ?? e);
    process.exit(1);
  }
}

try {
  execSync('node scripts/generate-feature-flags-doc.mjs --check', {
    cwd: root,
    stdio: 'inherit',
  });
} catch (e) {
  const status = e && typeof e === 'object' ? e.status : undefined;
  process.exit(typeof status === 'number' ? status : 1);
}

console.log(
  `verify-docs: OK (${routeCount} API route modules, inventory in sync; feature flags doc; no banned patterns in web/)`,
);
