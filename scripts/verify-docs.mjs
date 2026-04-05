#!/usr/bin/env node
/**
 * Fails fast when generated API inventory drifts from the route tree, when the
 * public schema index counts drift from web/types/supabase.ts, when relative
 * links in canonical docs break, when Zustand store counts / logout-cascade
 * order in ARCHITECTURE / STATE_MANAGEMENT drift from userStore.ts, when
 * ARCHITECTURE App Router boundary counts drift from web/app, when ARCHITECTURE
 * Postgres table / view / RPC counts drift from web/types/supabase.ts, or when
 * banned doc path strings appear under web/ (historical broken pointers),
 * or when web/.env.local.example drifts from web/lib/config/env.ts,
 * or when .cursor/mcp.json embeds machine-specific absolute paths.
 *
 * Run from repo root: node scripts/verify-docs.mjs
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  computeSurfaceCounts,
  parsePublicIndexGeneratedCounts,
  walkRouteFiles,
} from './lib/surface-counts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

/** Run `node <script>` from repo root; inherit stdio; propagate exit code. */
function runNodeScript(scriptRelative, extraArgs = '') {
  const cmd = extraArgs
    ? `node ${scriptRelative} ${extraArgs}`
    : `node ${scriptRelative}`;
  try {
    execSync(cmd, { cwd: root, stdio: 'inherit' });
  } catch (e) {
    const status = e && typeof e === 'object' ? e.status : undefined;
    process.exit(typeof status === 'number' ? status : 1);
  }
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

let surface;
try {
  surface = computeSurfaceCounts(root);
} catch (e) {
  console.error('verify-docs: surface counts failed:', e?.message ?? e);
  process.exit(1);
}

if (surface.nextJsRouteHandlers !== routeCount) {
  console.error(
    `verify-docs: internal error — route tally ${routeCount} != computeSurfaceCounts ${surface.nextJsRouteHandlers}`,
  );
  process.exit(1);
}

const indexPath = join(root, 'docs/DATABASE_SCHEMA_PUBLIC_INDEX.generated.md');
let indexText;
try {
  indexText = readFileSync(indexPath, 'utf8');
} catch {
  console.error(
    'verify-docs: missing docs/DATABASE_SCHEMA_PUBLIC_INDEX.generated.md — run npm run docs:public-schema-index',
  );
  process.exit(1);
}

const idx = parsePublicIndexGeneratedCounts(indexText);
if (idx.publicTables == null || idx.publicViews == null || idx.publicRpcs == null) {
  console.error(
    'verify-docs: could not parse Public tables/views/RPC counts in docs/DATABASE_SCHEMA_PUBLIC_INDEX.generated.md',
  );
  process.exit(1);
}

if (
  idx.publicTables !== surface.publicTables ||
  idx.publicViews !== surface.publicViews ||
  idx.publicRpcs !== surface.publicRpcFunctions
) {
  console.error(
    'verify-docs: docs/DATABASE_SCHEMA_PUBLIC_INDEX.generated.md counts do not match web/types/supabase.ts.\n' +
      `  generated md: tables=${idx.publicTables} views=${idx.publicViews} rpcs=${idx.publicRpcs}\n` +
      `  types file:   tables=${surface.publicTables} views=${surface.publicViews} rpcs=${surface.publicRpcFunctions}\n` +
      'Run: npm run docs:public-schema-index',
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

runNodeScript('scripts/generate-feature-flags-doc.mjs', '--check');
runNodeScript('scripts/sync-security-snapshots.mjs', '--check');
runNodeScript('scripts/verify-doc-links.mjs');
runNodeScript('scripts/verify-store-docs.mjs');
runNodeScript('scripts/verify-architecture-boundaries.mjs');
runNodeScript('scripts/verify-architecture-schema-counts.mjs');
runNodeScript('scripts/verify-env-example.mjs');
runNodeScript('scripts/verify-mcp-config.mjs');

console.log(
  `verify-docs: OK (${routeCount} API route modules; inventory + schema index + feature flags + SECURITY snapshots + doc links + store counts + app boundaries + ARCHITECTURE schema counts + env example + MCP paths; no banned patterns in web/)`,
);
