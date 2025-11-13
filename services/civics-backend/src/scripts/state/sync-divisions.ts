#!/usr/bin/env node
/**
 * Refresh representative_divisions using OpenStates current roles.
 *
 * Usage:
 *   npm run state:sync:divisions
 */
import 'dotenv/config';

import { getSupabaseClient } from '../../clients/supabase.js';

async function main(): Promise<void> {
  const client = getSupabaseClient();
  console.log('Refreshing representative_divisions from OpenStates roles…');
  const { data, error } = await client.rpc('refresh_divisions_from_openstates');
  if (error) {
    console.error('Division refresh failed:', error.message);
    process.exit(1);
  }

  console.log(
    `Division refresh complete. Rows inserted: ${
      typeof data === 'number' ? data : 0
    }.`,
  );
}

main().catch((error) => {
  console.error('Division refresh encountered an unexpected error:', error);
  process.exit(1);
});


