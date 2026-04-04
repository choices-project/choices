/**
 * Shared counts for public schema (supabase types) and Next.js API route modules.
 * Used by doc-surface-counts.mjs and verify-docs.mjs.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export function walkRouteFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkRouteFiles(p, acc);
    else if (name === 'route.ts') acc.push(p);
  }
  return acc;
}

function countBlockKeys(section, startNeedle, endNeedle, mode = 'table') {
  const start = section.indexOf(startNeedle);
  if (start === -1) return 0;
  const from = start + startNeedle.length;
  const end = section.indexOf(endNeedle, from);
  if (end === -1) return 0;
  const slice = section.slice(from, end);
  if (mode === 'rpc') {
    return (slice.match(/^      [a-z_][a-z0-9_]*:/gm) || []).length;
  }
  return (slice.match(/^      [a-z_][a-z0-9_]*: \{$/gm) || []).length;
}

/**
 * @param {string} root - repository root (parent of `web/`)
 * @returns {{
 *   publicTables: number,
 *   publicViews: number,
 *   publicRpcFunctions: number,
 *   nextJsRouteHandlers: number
 * }}
 */
export function computeSurfaceCounts(root) {
  const supabasePath = join(root, 'web/types/supabase.ts');
  const text = readFileSync(supabasePath, 'utf8');

  const publicIdx = text.indexOf('  public: {');
  if (publicIdx === -1) {
    throw new Error('computeSurfaceCounts: could not find public schema in web/types/supabase.ts');
  }
  const publicTail = text.slice(publicIdx);

  const tables = countBlockKeys(publicTail, 'Tables: {', '    Views: {', 'table');
  const views = countBlockKeys(publicTail, 'Views: {', '    Functions: {', 'table');
  const functions = countBlockKeys(publicTail, 'Functions: {', '    Enums: {', 'rpc');

  const apiRoot = join(root, 'web/app/api');
  const routes = walkRouteFiles(apiRoot).length;

  return {
    publicTables: tables,
    publicViews: views,
    publicRpcFunctions: functions,
    nextJsRouteHandlers: routes,
  };
}

export function parsePublicIndexGeneratedCounts(md) {
  const pick = (re) => {
    const m = md.match(re);
    return m ? Number.parseInt(m[1], 10) : null;
  };
  return {
    publicTables: pick(/\|\s*Public tables\s*\|\s*(\d+)\s*\|/),
    publicViews: pick(/\|\s*Public views\s*\|\s*(\d+)\s*\|/),
    publicRpcs: pick(/\|\s*Public RPCs[^|]*\|\s*(\d+)\s*\|/),
  };
}
