#!/usr/bin/env node
/**
 * Writes docs/DATABASE_SCHEMA_PUBLIC_INDEX.generated.md from web/types/supabase.ts.
 * Keeps DATABASE_SCHEMA.md narrative accurate without hand-maintaining 90+ table names.
 *
 * Run from repo root: node scripts/generate-public-schema-index.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const supabasePath = join(root, 'web/types/supabase.ts');
const outPath = join(root, 'docs/DATABASE_SCHEMA_PUBLIC_INDEX.generated.md');

const text = readFileSync(supabasePath, 'utf8');

const publicIdx = text.indexOf('  public: {');
if (publicIdx === -1) {
  console.error('Could not find public schema in web/types/supabase.ts');
  process.exit(1);
}
const publicTail = text.slice(publicIdx);

function sliceBetween(startNeedle, endNeedle) {
  const start = publicTail.indexOf(startNeedle);
  if (start === -1) return null;
  const from = start + startNeedle.length;
  const end = publicTail.indexOf(endNeedle, from);
  if (end === -1) return null;
  return publicTail.slice(from, end);
}

const tablesSlice = sliceBetween('Tables: {', '    Views: {');
const viewsSlice = sliceBetween('Views: {', '    Functions: {');
const functionsSlice = sliceBetween('Functions: {', '    Enums: {');

if (!tablesSlice || !viewsSlice || !functionsSlice) {
  console.error('Could not slice Tables/Views/Functions blocks');
  process.exit(1);
}

function tableKeys(slice) {
  const m = slice.match(/^      ([a-z_][a-z0-9_]*): \{$/gm) || [];
  return m.map((line) => line.replace(/^      ([a-z_][a-z0-9_]*): \{$/, '$1')).sort();
}

function rpcKeys(slice) {
  const m = slice.match(/^      ([a-z_][a-z0-9_]*):/gm) || [];
  return m.map((line) => line.replace(/^      ([a-z_][a-z0-9_]*):$/, '$1')).sort();
}

const tables = tableKeys(tablesSlice);
const views = tableKeys(viewsSlice);
const functions = rpcKeys(functionsSlice);

const today = new Date().toISOString().slice(0, 10);

const md = `# Public schema index (generated)

**Do not edit by hand.** Regenerate from repository root:

\`npm run docs:public-schema-index\`

| Source file | \`web/types/supabase.ts\` |
| Generated | ${today} |
| Public tables | ${tables.length} |
| Public views | ${views.length} |
| Public RPCs (\`Database['public']['Functions']\`) | ${functions.length} |

Cross-check counts: \`npm run docs:surface-counts\` (includes Next.js \`route.ts\` tally).

---

## Public tables (alphabetical)

${tables.map((n) => '- `' + n + '`').join('\n')}

---

## Public views (alphabetical)

${views.map((n) => '- `' + n + '`').join('\n')}

---

## Public RPC functions (alphabetical)

${functions.map((n) => '- `' + n + '`').join('\n')}
`;

writeFileSync(outPath, md, 'utf8');
console.log(`Wrote ${outPath} (${tables.length} tables, ${views.length} views, ${functions.length} RPCs)`);
