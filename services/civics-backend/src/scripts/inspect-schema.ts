#!/usr/bin/env node
import 'dotenv/config';

import { getSupabaseClient } from '../clients/supabase.js';

const TABLES = [
  'representatives_core',
  'representative_contacts',
  'representative_committees',
  'representative_social_media',
  'representative_photos',
  'representative_campaign_finance',
  'representative_crosswalk_enhanced',
  'representative_data_sources',
  'representative_data_quality',
] as const;

async function main(): Promise<void> {
  const client = getSupabaseClient();

  for (const table of TABLES) {
    const { data, error } = await client.rpc('get_table_columns', { target_table: table });

    if (error) {
      console.error(`Failed to inspect ${table}:`, error.message);
      continue;
    }

    console.log(`\n${table}`);
    for (const row of data ?? []) {
      const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
      const nullable = row.is_nullable === 'YES' ? 'null' : 'not null';
      console.log(`  ${row.column_name}: ${row.data_type}${length} [${nullable}]`);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

