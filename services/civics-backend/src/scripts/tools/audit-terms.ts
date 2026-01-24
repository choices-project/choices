#!/usr/bin/env node
/**
 * Audit representatives_core for active reps missing term_end_date or next_election_date.
 *
 * sync_representatives_from_openstates sets term_start_date / term_end_date from OpenStates
 * roles; next_election_date is not populated by the merge. Populate via state/federal
 * enrich or derive from term_end_date. Use ingest:qa (or this script) to validate.
 *
 * Run: npm run build && node build/scripts/tools/audit-terms.js
 * Or: npm run tools:audit:terms
 */
import 'dotenv/config';

import { getSupabaseClient } from '../../clients/supabase.js';

async function main(): Promise<void> {
  const client = getSupabaseClient();

  const { count: activeTotal, error: totalErr } = await client
    .from('representatives_core')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  if (totalErr) {
    console.error('Failed to count active reps:', totalErr.message);
    process.exit(1);
  }

  const { count: missingTermEnd, error: termErr } = await client
    .from('representatives_core')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .is('term_end_date', null);

  if (termErr) {
    console.error('Failed to count missing term_end_date:', termErr.message);
    process.exit(1);
  }

  const { count: missingNextElection, error: nextErr } = await client
    .from('representatives_core')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .is('next_election_date', null);

  if (nextErr) {
    console.error('Failed to count missing next_election_date:', nextErr.message);
    process.exit(1);
  }

  const total = activeTotal ?? 0;
  const missingTerm = missingTermEnd ?? 0;
  const missingNext = missingNextElection ?? 0;

  console.log('Term / next_election audit (representatives_core, is_active=true)');
  console.log(`  Active total: ${total}`);
  console.log(`  Missing term_end_date: ${missingTerm}${total > 0 ? ` (${((missingTerm / total) * 100).toFixed(1)}%)` : ''}`);
  console.log(`  Missing next_election_date: ${missingNext}${total > 0 ? ` (${((missingNext / total) * 100).toFixed(1)}%)` : ''}`);

  if (missingTerm === 0 && missingNext === 0) {
    console.log('\nOK: All active reps have term_end_date and next_election_date.');
  } else {
    console.log('\nPopulate via state/federal enrich or derive from term_end_date. See ROADMAP § Term / next_election.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
