#!/usr/bin/env node
/**
 * Execute the SQL merge function sync_representatives_from_openstates().
 *
 * Run via: `npm run openstates:merge`
 */
import 'dotenv/config';

import { getSupabaseClient } from '../../clients/supabase.js';
import { syncActivityForRepresentatives } from '../../workflows/activity-sync.js';

async function main() {
  const client = getSupabaseClient();
  console.log('Running sync_representatives_from_openstates()...');
  const { data, error } = await client.rpc('sync_representatives_from_openstates');
  if (error) {
    console.error('Merge failed:', error.message);
    process.exit(1);
  }
  console.log('Merge completed successfully.', data ?? '');

  if (process.env.SKIP_ACTIVITY_SYNC === '1') {
    console.log('Skipping OpenStates activity sync (SKIP_ACTIVITY_SYNC=1).');
    return;
  }

  console.log('Syncing OpenStates bill activity (post-merge)...');
  const result = await syncActivityForRepresentatives({ logger: console });
  console.log(
    `Activity sync complete (${result.processed}/${result.total}, failed: ${result.failed}). Activity rows written: ${result.activityRows}.`,
  );
}

main().catch((error) => {
  console.error('Unexpected failure:', error);
  process.exit(1);
});


