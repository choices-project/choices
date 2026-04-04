#!/usr/bin/env node
/**
 * Prints counts derived from generated Supabase types and the API route tree.
 * Use when updating docs that reference table / RPC / route cardinality.
 *
 * Run from repo root: node scripts/doc-surface-counts.mjs
 */
import { dirname, join, relative } from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { computeSurfaceCounts, walkRouteFiles } from './lib/surface-counts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

function methodsForRoute(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const found = [];
  for (const m of METHODS) {
    const re = new RegExp(`export (const|async function|function) ${m}\\b`);
    if (re.test(content)) found.push(m);
  }
  return found.sort().join(', ') || '—';
}

const counts = computeSurfaceCounts(root);

console.log(
  JSON.stringify(
    {
      source: 'web/types/supabase.ts (public schema)',
      publicTables: counts.publicTables,
      publicViews: counts.publicViews,
      publicRpcFunctions: counts.publicRpcFunctions,
      nextJsRouteHandlers: counts.nextJsRouteHandlers,
      generatedAt: new Date().toISOString().slice(0, 10),
    },
    null,
    2,
  ),
);

const apiRoot = join(root, 'web/app/api');
const sample = walkRouteFiles(apiRoot).sort()[0];
if (sample) {
  console.log(
    '\nExample (first path alphabetically):',
    relative(root, sample),
    '→',
    methodsForRoute(sample),
  );
}
