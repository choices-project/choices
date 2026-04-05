#!/usr/bin/env node
/**
 * Ensures docs/ARCHITECTURE.md counts for App Router boundaries match web/app:
 * - web/app/global-error.tsx exists
 * - Counts of nested `error.tsx` and `loading.tsx` files under `web/app/`
 *
 * Run from repo root: node scripts/verify-architecture-boundaries.mjs
 */
import { existsSync, readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const appRoot = join(root, 'web/app');
const archPath = join(root, 'docs/ARCHITECTURE.md');

function walkNamedFiles(dir, filename, acc = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walkNamedFiles(p, filename, acc);
    else if (ent.name === filename) acc.push(p);
  }
  return acc;
}

function main() {
  const globalError = join(appRoot, 'global-error.tsx');
  if (!existsSync(globalError)) {
    console.error('verify-architecture-boundaries: missing web/app/global-error.tsx');
    process.exit(1);
  }

  const errorFiles = walkNamedFiles(appRoot, 'error.tsx');
  const loadingFiles = walkNamedFiles(appRoot, 'loading.tsx');

  const arch = readFileSync(archPath, 'utf8');
  const re =
    /\+\s*\*\*(\d+)\*\*\s+route-level\s+`error\.tsx`\s+\+\s*\*\*(\d+)\*\*\s+`loading\.tsx`\s+files/;
  const m = arch.match(re);
  if (!m) {
    console.error(
      'verify-architecture-boundaries: could not parse boundary counts in docs/ARCHITECTURE.md (expected: + **N** route-level `error.tsx` + **M** `loading.tsx` files)',
    );
    process.exit(1);
  }

  const docError = Number.parseInt(m[1], 10);
  const docLoading = Number.parseInt(m[2], 10);
  const nError = errorFiles.length;
  const nLoading = loadingFiles.length;

  if (docError !== nError || docLoading !== nLoading) {
    console.error(
      'verify-architecture-boundaries: ARCHITECTURE.md says ' +
        `${docError} error.tsx / ${docLoading} loading.tsx but web/app has ${nError} / ${nLoading}. Update the Security bullet in docs/ARCHITECTURE.md.`,
    );
    process.exit(1);
  }

  console.log(
    `verify-architecture-boundaries: OK (global-error.tsx; ${nError} error.tsx; ${nLoading} loading.tsx)`,
  );
}

main();
