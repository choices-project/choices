#!/usr/bin/env node
/**
 * Refreshes numeric snapshots in docs/SECURITY.md from ripgrep (admin client +
 * apiRateLimiter usage). Keeps prose stable; only regions between markers are
 * rewritten.
 *
 *   node scripts/sync-security-snapshots.mjs         # update docs/SECURITY.md
 *   node scripts/sync-security-snapshots.mjs --check # exit 1 if doc would change
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const mdPath = join(root, 'docs/SECURITY.md');

const MARK_ADMIN_START = '<!-- AUTO-GENERATED:ADMIN_CLIENT_ROUTE_SNAPSHOT -->';
const MARK_ADMIN_END = '<!-- END AUTO-GENERATED:ADMIN_CLIENT_ROUTE_SNAPSHOT -->';

const MARK_RL_START = '<!-- AUTO-GENERATED:RATE_LIMIT_ROUTE_SNAPSHOT -->';
const MARK_RL_END = '<!-- END AUTO-GENERATED:RATE_LIMIT_ROUTE_SNAPSHOT -->';

function rgCountList(pattern) {
  try {
    const out = execSync(
      `rg -l "${pattern}" web/app/api --glob '**/route.ts'`,
      { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();
    return out ? out.split('\n').sort() : [];
  } catch (e) {
    const status = e && typeof e === 'object' ? e.status : undefined;
    if (status === 1) return [];
    throw e;
  }
}

function splice(full, startMark, endMark, inner) {
  const a = full.indexOf(startMark);
  const b = full.indexOf(endMark);
  if (a === -1 || b === -1 || b < a) {
    throw new Error(
      `sync-security-snapshots: missing markers in docs/SECURITY.md\n  ${startMark}\n  ${endMark}`,
    );
  }
  const afterStart = a + startMark.length;
  const prev = full.slice(afterStart, b).trim();
  const next =
    full.slice(0, afterStart) +
    '\n\n' +
    inner.trim() +
    '\n\n' +
    full.slice(b);
  return { next, prev, newInner: inner.trim() };
}

function main() {
  const check = process.argv.includes('--check');
  const adminFiles = rgCountList('getSupabaseAdminClient');
  const rateLimitFiles = rgCountList('apiRateLimiter\\.checkLimit');

  const adminN = adminFiles.length;
  const rlN = rateLimitFiles.length;

  const adminLine = `_(Snapshot: **${adminN}** distinct \`route.ts\` files under \`web/app/api\` import \`getSupabaseAdminClient\`—re-run the \`rg\` command above after adding routes.)_`;

  const rlLine = `_(**${rlN}** \`route.ts\` files call \`apiRateLimiter.checkLimit\` at least once—the markdown table below is a curated overview and may group methods; trust \`rg\` for completeness.)_`;

  let md = readFileSync(mdPath, 'utf8');
  let changed = false;

  const s1 = splice(md, MARK_ADMIN_START, MARK_ADMIN_END, adminLine);
  if (s1.prev !== s1.newInner) changed = true;
  md = s1.next;

  const s2 = splice(md, MARK_RL_START, MARK_RL_END, rlLine);
  if (s2.prev !== s2.newInner) changed = true;
  md = s2.next;

  if (check) {
    if (changed) {
      console.error(
        'sync-security-snapshots --check: docs/SECURITY.md snapshots are stale.\n' +
          'Run: npm run docs:security-snapshots',
      );
      process.exit(1);
    }
    console.log(
      `sync-security-snapshots --check: OK (admin routes=${adminN}, rate-limited route files=${rlN})`,
    );
    return;
  }

  writeFileSync(mdPath, md, 'utf8');
  console.log(`sync-security-snapshots: updated ${mdPath} (admin=${adminN}, rate-limit files=${rlN})`);
}

main();
