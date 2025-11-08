#!/usr/bin/env node
/**
 * Execute the SQL merge function sync_representatives_from_openstates().
 */
import 'dotenv/config';

import { getSupabaseClient } from '../clients/supabase.js';

async function main() {
  const client = getSupabaseClient();
  console.log('Running sync_representatives_from_openstates()...');
  const { data, error } = await client.rpc('sync_representatives_from_openstates');
  if (error) {
    console.error('Merge failed:', error.message);
    process.exit(1);
  }
  console.log('Merge completed successfully.', data ?? '');
}

main().catch((error) => {
  console.error('Unexpected failure:', error);
  process.exit(1);
});

