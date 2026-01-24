#!/usr/bin/env node
/**
 * Audit representative_activity for non‑bill or election‑like rows.
 *
 * Canonical source: OpenStates bill activity only (see persist/activity.ts).
 * type must be 'bill'; title must not be "Election: …".
 *
 * Run: npm run tools:audit:activity [-- --fix]
 *   --fix  Delete non‑canonical rows (default: report only).
 */
import 'dotenv/config';

import { getSupabaseClient } from '../../clients/supabase.js';

type Row = {
  id: number;
  representative_id: number;
  type: string;
  title: string;
  source: string | null;
};

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');

  const client = getSupabaseClient();

  const { data: nonBill, error: e1 } = await client
    .from('representative_activity')
    .select('id, representative_id, type, title, source')
    .neq('type', 'bill');

  if (e1) {
    console.error('Failed to fetch type != bill:', e1.message);
    process.exit(1);
  }

  const { data: electionTitled, error: e2 } = await client
    .from('representative_activity')
    .select('id, representative_id, type, title, source')
    .ilike('title', 'Election:%');

  if (e2) {
    console.error('Failed to fetch title ILIKE Election:%:', e2.message);
    process.exit(1);
  }

  const byId = new Map<number, Row>();
  for (const r of nonBill ?? []) byId.set(r.id, r as Row);
  for (const r of electionTitled ?? []) byId.set(r.id, r as Row);
  const bad = [...byId.values()];

  if (bad.length === 0) {
    console.log('OK: representative_activity contains only canonical bill activity (type=bill, title not "Election:…").');
    return;
  }

  console.log(`Found ${bad.length} non‑canonical representative_activity row(s):`);
  for (const r of bad) {
    console.log(`  id=${r.id} rep_id=${r.representative_id} type=${r.type} title=${r.title} source=${r.source ?? ''}`);
  }

  if (!fix) {
    console.log('\nRe-run with --fix to delete these rows. Canonical activity = bills only (persist/activity.ts).');
    process.exit(1);
  }

  const ids = bad.map((r) => r.id);
  const { error: delErr } = await client.from('representative_activity').delete().in('id', ids);

  if (delErr) {
    console.error('Failed to delete:', delErr.message);
    process.exit(1);
  }

  console.log(`\nDeleted ${ids.length} row(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
