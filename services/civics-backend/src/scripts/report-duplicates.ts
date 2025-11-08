#!/usr/bin/env node
import 'dotenv/config';

import { getSupabaseClient } from '../clients/supabase.js';

interface DuplicateCanonicalRow {
  canonical_id: string;
  ids: number[];
}

async function main(): Promise<void> {
  const client = getSupabaseClient();

  const { data, error } = await client.rpc('get_duplicate_canonical_ids');
  if (error) {
    throw new Error(`Failed to inspect duplicate canonicals: ${error.message}`);
  }

  const duplicates = (data ?? []) as DuplicateCanonicalRow[];
  if (duplicates.length === 0) {
    console.log('✅ No duplicate canonical IDs detected.');
    return;
  }

  console.log(`⚠️ Found ${duplicates.length} canonical ID group(s) with duplicate representatives_core rows.`);
  for (const group of duplicates) {
    const sorted = [...(group.ids ?? [])].sort((a, b) => a - b);
    console.log(`  • ${group.canonical_id}: keep ${sorted[0]}, remove [${sorted.slice(1).join(', ')}]`);
  }

  console.log('\nNext steps:');
  console.log('  • Review the duplicates above.');
  console.log('  • Run `npm run fix:duplicates -- --canonical=<canonical_id> --apply` to clean specific groups.');
  console.log('  • Or run `npm run fix:duplicates -- --apply` to process all groups (skips any with dependent data).');

  process.exitCode = 1;
}

main().catch((error) => {
  console.error('Duplicate canonical audit failed:', error);
  process.exit(1);
});

