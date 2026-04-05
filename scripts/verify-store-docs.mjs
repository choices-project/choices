#!/usr/bin/env node
/**
 * Ensures documented Zustand store counts match the codebase:
 * - *Store.ts files directly under web/lib/stores/
 * - cascadeDependentStoreReset() entries in userStore.ts
 *
 * Run from repo root: node scripts/verify-store-docs.mjs
 */
import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const storesDir = join(root, 'web/lib/stores');
const userStorePath = join(storesDir, 'userStore.ts');
const stateMgmtPath = join(root, 'docs/STATE_MANAGEMENT.md');
const archPath = join(root, 'docs/ARCHITECTURE.md');

function countTopLevelStoreModules() {
  return readdirSync(storesDir).filter((n) => n.endsWith('Store.ts')).length;
}

function countCascadeResets() {
  const text = readFileSync(userStorePath, 'utf8');
  const needle = 'const stores: Array<{ name: string; reset: () => void }> = [';
  const start = text.indexOf(needle);
  if (start === -1) {
    throw new Error('verify-store-docs: could not find cascade stores array in userStore.ts');
  }
  const from = start + needle.length;
  const end = text.indexOf('\n  ];', from);
  if (end === -1) {
    throw new Error('verify-store-docs: could not find end of cascade stores array');
  }
  const slice = text.slice(from, end);
  const m = slice.match(/\{ name: '/g);
  return m ? m.length : 0;
}

function expectFileInt(path, re, label, expected) {
  const text = readFileSync(path, 'utf8');
  const m = text.match(re);
  if (!m) {
    console.error(`verify-store-docs: could not find ${label} in ${path}`);
    process.exit(1);
  }
  const found = Number.parseInt(m[1], 10);
  if (found !== expected) {
    console.error(
      `verify-store-docs: ${path} documents ${label} as **${found}** but codebase has ${expected}. Update the doc.`,
    );
    process.exit(1);
  }
}

function main() {
  let modules;
  let cascade;
  try {
    modules = countTopLevelStoreModules();
    cascade = countCascadeResets();
  } catch (e) {
    console.error(e?.message ?? e);
    process.exit(1);
  }

  expectFileInt(
    stateMgmtPath,
    /There are \*\*(\d+)\*\* `\*Store\.ts` modules/,
    '*Store.ts module count',
    modules,
  );
  expectFileInt(
    stateMgmtPath,
    /Only \*\*(\d+)\*\* of them are reset by/,
    'cascade reset count',
    cascade,
  );

  expectFileInt(archPath, /Zustand \(~(\d+) store modules/, 'architecture diagram store count', modules);
  expectFileInt(archPath, /\*\*(\d+)\*\* dependent stores \(/, 'architecture cascade count', cascade);

  console.log(
    `verify-store-docs: OK (${modules} top-level *Store.ts modules, ${cascade} cascade resets; docs match)`,
  );
}

main();
