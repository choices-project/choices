#!/usr/bin/env node
/**
 * Ensures docs/ARCHITECTURE.md public schema cardinality (~tables, views, ~RPCs)
 * matches web/types/supabase.ts (same logic as docs:surface-counts).
 *
 * Run from repo root: node scripts/verify-architecture-schema-counts.mjs
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { computeSurfaceCounts } from './lib/surface-counts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const archPath = join(root, 'docs/ARCHITECTURE.md');

function main() {
  let surface;
  try {
    surface = computeSurfaceCounts(root);
  } catch (e) {
    console.error('verify-architecture-schema-counts:', e?.message ?? e);
    process.exit(1);
  }

  const arch = readFileSync(archPath, 'utf8');

  const diagram = arch.match(/~(\d+) public tables,\s*(\d+)\s+views,\s*~(\d+)\s+RPCs/);
  if (!diagram) {
    console.error(
      'verify-architecture-schema-counts: could not parse diagram line in docs/ARCHITECTURE.md (expected: ~N public tables, M views, ~K RPCs)',
    );
    process.exit(1);
  }

  const proseTables = arch.match(/\*\*~(\d+) public tables\*\*\s+and\s+\*\*(\d+)\s+views\*\*/);
  const proseRpc = arch.match(/\*\*~(\d+)\s+RPC\*\*\s+entries/);
  if (!proseTables || !proseRpc) {
    console.error(
      'verify-architecture-schema-counts: could not parse Database § prose counts in docs/ARCHITECTURE.md',
    );
    process.exit(1);
  }

  const checks = [
    ['diagram tables', Number.parseInt(diagram[1], 10), surface.publicTables],
    ['diagram views', Number.parseInt(diagram[2], 10), surface.publicViews],
    ['diagram RPCs', Number.parseInt(diagram[3], 10), surface.publicRpcFunctions],
    ['prose tables', Number.parseInt(proseTables[1], 10), surface.publicTables],
    ['prose views', Number.parseInt(proseTables[2], 10), surface.publicViews],
    ['prose RPCs', Number.parseInt(proseRpc[1], 10), surface.publicRpcFunctions],
  ];

  for (const [label, docN, codeN] of checks) {
    if (docN !== codeN) {
      console.error(
        `verify-architecture-schema-counts: ARCHITECTURE.md ${label}: doc says ${docN} but web/types/supabase.ts yields ${codeN}. ` +
          'Update the diagram + Database bullet, or run `npm run docs:surface-counts`.',
      );
      process.exit(1);
    }
  }

  console.log(
    `verify-architecture-schema-counts: OK (${surface.publicTables} tables, ${surface.publicViews} views, ${surface.publicRpcFunctions} RPCs)`,
  );
}

main();
