#!/usr/bin/env node
/**
 * Prints counts derived from generated Supabase types and the API route tree.
 * Use when updating docs that reference table / RPC / route cardinality.
 *
 * Run from repo root: node scripts/doc-surface-counts.mjs
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const supabasePath = join(root, 'web/types/supabase.ts');

const text = readFileSync(supabasePath, 'utf8');

function countBlockKeys(section, startNeedle, endNeedle, mode = 'table') {
  const start = section.indexOf(startNeedle);
  if (start === -1) return 0;
  const from = start + startNeedle.length;
  const end = section.indexOf(endNeedle, from);
  if (end === -1) return 0;
  const slice = section.slice(from, end);
  if (mode === 'rpc') {
    // RPC overloads use `name:\n        |` (no `{` on the name line).
    return (slice.match(/^      [a-z_][a-z0-9_]*:/gm) || []).length;
  }
  return (slice.match(/^      [a-z_][a-z0-9_]*: \{$/gm) || []).length;
}

const publicIdx = text.indexOf('  public: {');
if (publicIdx === -1) {
  console.error('Could not find public schema in web/types/supabase.ts');
  process.exit(1);
}
const publicTail = text.slice(publicIdx);

const tables = countBlockKeys(publicTail, 'Tables: {', '    Views: {', 'table');
const views = countBlockKeys(publicTail, 'Views: {', '    Functions: {', 'table');
const functions = countBlockKeys(publicTail, 'Functions: {', '    Enums: {', 'rpc');

function walkRouteFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkRouteFiles(p, acc);
    else if (name === 'route.ts') acc.push(p);
  }
  return acc;
}

const apiRoot = join(root, 'web/app/api');
const routes = walkRouteFiles(apiRoot).length;

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

console.log(JSON.stringify(
  {
    source: 'web/types/supabase.ts (public schema)',
    publicTables: tables,
    publicViews: views,
    publicRpcFunctions: functions,
    nextJsRouteHandlers: routes,
    generatedAt: new Date().toISOString().slice(0, 10),
  },
  null,
  2,
));

// Optional: sample first route for sanity
const sample = walkRouteFiles(apiRoot).sort()[0];
if (sample) {
  console.log(
    '\nExample (first path alphabetically):',
    relative(root, sample),
    '→',
    methodsForRoute(sample),
  );
}
