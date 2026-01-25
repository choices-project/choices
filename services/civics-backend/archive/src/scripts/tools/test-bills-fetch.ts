#!/usr/bin/env node
/**
 * Test that OpenStates bills fetch works with jurisdiction/q.
 * Loads a few reps, fetches bills for each, logs options + results, then runs
 * a real activity sync and verifies representative_activity has bill rows.
 *
 * Run: npm run build && node build/scripts/tools/test-bills-fetch.js
 * Or: npm run tools:test:bills (if added to package.json)
 */
import 'dotenv/config';

import { getSupabaseClient } from '../../clients/supabase.js';
import { fetchRecentBillsForPerson } from '../../clients/openstates.js';
import { deriveJurisdictionFilter } from '../../enrich/state.js';
import { collectActiveRepresentatives } from '../../ingest/openstates/index.js';
import { fetchFederalRepresentatives } from '../../ingest/supabase/representatives.js';
import { syncRepresentativeActivity } from '../../persist/activity.js';

const LIMIT = 5;
const STATES = ['AK'];

async function main(): Promise<void> {
  console.log('=== 1. Load representatives (AK, limit 5) ===\n');

  const federalReps = await fetchFederalRepresentatives({
    states: STATES,
    limit: LIMIT,
  });
  const stateReps = await collectActiveRepresentatives({
    states: STATES,
    limit: LIMIT,
  });
  const reps = [...federalReps, ...stateReps]
    .filter((r) => r.supabaseRepresentativeId != null)
    .slice(0, LIMIT);

  if (reps.length === 0) {
    console.log('No eligible reps found. Exiting.');
    process.exit(1);
  }

  console.log(`Loaded ${reps.length} rep(s):`);
  for (const r of reps) {
    console.log(`  - ${r.name} (${r.state}) id=${r.supabaseRepresentativeId} os=${r.openstatesId}`);
  }

  console.log('\n=== 2. Fetch bills for each (log options + count) ===\n');

  const limit = Number(process.env.OPENSTATES_ACTIVITY_LIMIT ?? '8');
  let anyBills = false;

  for (const rep of reps) {
    const jurisdiction = deriveJurisdictionFilter(rep);
    const fetchOpts: { limit: number; jurisdiction?: string; query?: string } = { limit };
    if (jurisdiction) fetchOpts.jurisdiction = jurisdiction;
    if (!jurisdiction) fetchOpts.query = rep.name || rep.openstatesId || undefined;

    const bills = await fetchRecentBillsForPerson(rep.openstatesId || '', fetchOpts);
    anyBills = anyBills || bills.length > 0;

    console.log(`${rep.name} (${rep.openstatesId}):`);
    console.log(`  fetch options: ${JSON.stringify(fetchOpts)}`);
    console.log(`  bills returned: ${bills.length}`);
    if (bills.length > 0) {
      console.log(`  first bill: "${(bills[0] as { title?: string }).title ?? 'n/a'}"`);
    }
    console.log('');
  }

  if (!anyBills) {
    console.log('No bills returned for any rep. Try another state or check OpenStates API.');
    process.exit(1);
  }

  console.log('=== 3. Run real activity sync (persist) for same reps ===\n');

  for (const rep of reps) {
    try {
      await syncRepresentativeActivity(rep);
      console.log(`  Synced activity for ${rep.name} (id=${rep.supabaseRepresentativeId})`);
    } catch (e) {
      console.error(`  Failed to sync ${rep.name}:`, (e as Error).message);
      process.exit(1);
    }
  }

  console.log('\n=== 4. Verify representative_activity has bill rows ===\n');

  const ids = reps.map((r) => r.supabaseRepresentativeId as number);
  const client = getSupabaseClient();
  const { data: rows, error } = await client
    .from('representative_activity')
    .select('id, representative_id, type, title, description, metadata')
    .in('representative_id', ids)
    .eq('type', 'bill');

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  const count = rows?.length ?? 0;
  console.log(`representative_activity bill rows for rep ids [${ids.join(', ')}]: ${count}`);
  if (count > 0) {
    for (const r of (rows ?? []).slice(0, 5)) {
      const row = r as { representative_id: number; title?: string; description?: string | null; metadata?: { sponsorship_role?: string; my_votes?: unknown } | null };
      console.log(`  - rep_id=${row.representative_id} "${row.title}"`);
      if (row.description) console.log(`    description: ${row.description.slice(0, 120)}${(row.description?.length ?? 0) > 120 ? '…' : ''}`);
    }
    if (count > 5) console.log(`  ... and ${count - 5} more`);
  }

  const withSponsorship = (rows ?? []).filter(
    (r) => {
      const row = r as { description?: string | null; metadata?: { sponsorship_role?: string } | null };
      return (
        (typeof row.description === 'string' && row.description.includes('Sponsor:')) ||
        (row.metadata?.sponsorship_role != null)
      );
    },
  );
  if (withSponsorship.length === 0 && reps.some((r) => r.openstatesId)) {
    console.error('\nAssertion failed: expected at least one activity row with sponsorship (description "Sponsor:…" or metadata.sponsorship_role) for reps with openstatesId.');
    process.exit(1);
  }
  console.log(`\nSponsorship present in ${withSponsorship.length} activity row(s).`);

  console.log('\n=== Done ===');
  process.exit(count > 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
