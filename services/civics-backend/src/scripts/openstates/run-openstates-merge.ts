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

  console.log('Deactivating non-current representatives...');
  const { data: deactivated, error: deactivateError } = await client.rpc(
    'deactivate_non_current_openstates_reps',
  );
  if (deactivateError) {
    console.error('Deactivate non-current failed:', deactivateError.message);
    process.exit(1);
  }
  const n =
    typeof deactivated === 'number'
      ? deactivated
      : (deactivated as Record<string, number> | null)?.deactivate_non_current_openstates_reps ?? 0;
  console.log(`Deactivated ${n} non-current representative(s).`);

  console.log('Refreshing representative_divisions from OpenStates roles...');
  const { data: divisionsInserted, error: divisionError } = await client.rpc(
    'refresh_divisions_from_openstates',
  );
  if (divisionError) {
    console.error('Division refresh failed:', divisionError.message);
    process.exit(1);
  }
  console.log(
    `Division refresh complete. Rows inserted: ${typeof divisionsInserted === 'number' ? divisionsInserted : 0}.`,
  );

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


