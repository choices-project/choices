#!/usr/bin/env node
/**
 * Execute the SQL merge function sync_representatives_from_openstates().
 *
 * Run via: `npm run openstates:merge`
 */
import { loadEnv } from '../utils/load-env.js';
loadEnv();

import { getSupabaseClient } from '../clients/supabase.js';
import { logger } from '../utils/logger.js';
import { syncActivityForRepresentatives } from '../workflows/activity-sync.js';

async function main() {
  const client = getSupabaseClient();
  logger.info('Running sync_representatives_from_openstates()...');
  const { data, error } = await client.rpc('sync_representatives_from_openstates');
  if (error) {
    logger.error('Merge failed', { error: error.message });
    process.exit(1);
  }
  logger.info('Merge completed successfully.', data ? { data } : undefined);

  logger.info('Deactivating non-current representatives...');
  const { data: deactivated, error: deactivateError } = await client.rpc(
    'deactivate_non_current_openstates_reps',
  );
  if (deactivateError) {
    logger.error('Deactivate non-current failed', { error: deactivateError.message });
    process.exit(1);
  }
  const n =
    typeof deactivated === 'number'
      ? deactivated
      : (deactivated as Record<string, number> | null)?.deactivate_non_current_openstates_reps ?? 0;
  logger.info(`Deactivated ${n} non-current representative(s).`);

  logger.info('Refreshing representative_divisions from OpenStates roles...');
  const { data: divisionsInserted, error: divisionError } = await client.rpc(
    'refresh_divisions_from_openstates',
  );
  if (divisionError) {
    logger.error('Division refresh failed', { error: divisionError.message });
    process.exit(1);
  }
  logger.info(
    `Division refresh complete. Rows inserted: ${typeof divisionsInserted === 'number' ? divisionsInserted : 0}.`,
  );

  if (process.env.SKIP_ACTIVITY_SYNC === '1') {
    logger.info('Skipping OpenStates activity sync (SKIP_ACTIVITY_SYNC=1).');
    return;
  }

  logger.info('Syncing OpenStates bill activity (post-merge)...');
  const result = await syncActivityForRepresentatives({
    logger: { log: logger.info.bind(logger), warn: logger.warn.bind(logger), error: logger.error.bind(logger) },
  });
  logger.info(
    `Activity sync complete (${result.processed}/${result.total}, failed: ${result.failed}). Activity rows written: ${result.activityRows}.`,
  );
}

main().catch((error) => {
  logger.error('Unexpected failure', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});


