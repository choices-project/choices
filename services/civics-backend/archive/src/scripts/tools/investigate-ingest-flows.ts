#!/usr/bin/env node
/**
 * Comprehensive investigation of civics ingest flows: schema, functions, RPCs, indexes, RLS.
 *
 * Run via: `npm run tools:investigate:ingest`
 */
import 'dotenv/config';

import { getSupabaseClient } from '../../clients/supabase.js';

const CIVICS_TABLES = [
  'representatives_core',
  'representative_activity',
  'id_crosswalk',
  'representative_crosswalk_enhanced',
  'civic_elections',
  'representative_divisions',
  'representative_contacts',
  'representative_committees',
  'representative_social_media',
  'representative_photos',
  'representative_data_sources',
  'representative_data_quality',
] as const;

const STAGING_TABLES = [
  'openstates_people_data',
  'openstates_people_roles',
  'openstates_people_contacts',
  'openstates_people_social_media',
  'openstates_people_identifiers',
  'openstates_people_sources',
] as const;

interface SchemaColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  character_maximum_length: number | null;
  column_default: string | null;
}

async function querySchema(client: ReturnType<typeof getSupabaseClient>, tables: readonly string[]): Promise<void> {
  console.log('\n=== SCHEMA: Canonical & Supporting Tables ===\n');

  for (const table of tables) {
    const { data, error } = await client.rpc('get_table_columns', { target_table: table });

    if (error) {
      console.error(`❌ ${table}: ${error.message}`);
      continue;
    }

    const columns = (data ?? []) as SchemaColumn[];
    if (columns.length === 0) {
      console.warn(`⚠️  ${table}: No columns found (table may not exist)`);
      continue;
    }

    console.log(`\n📋 ${table} (${columns.length} columns):`);
    for (const col of columns) {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const nullable = col.is_nullable === 'YES' ? 'null' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  • ${col.column_name}: ${col.data_type}${length} [${nullable}]${defaultVal}`);
    }
  }
}

async function queryStagingSchema(client: ReturnType<typeof getSupabaseClient>): Promise<void> {
  console.log('\n=== SCHEMA: Staging Tables ===\n');

  for (const table of STAGING_TABLES) {
    const { data, error } = await client.rpc('get_table_columns', { target_table: table });

    if (error) {
      console.error(`❌ ${table}: ${error.message}`);
      continue;
    }

    const columns = (data ?? []) as SchemaColumn[];
    if (columns.length === 0) {
      console.warn(`⚠️  ${table}: No columns found (table may not exist)`);
      continue;
    }

    console.log(`\n📋 ${table} (${columns.length} columns):`);
    for (const col of columns.slice(0, 10)) {
      // Show first 10 columns only
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const nullable = col.is_nullable === 'YES' ? 'null' : 'NOT NULL';
      console.log(`  • ${col.column_name}: ${col.data_type}${length} [${nullable}]`);
    }
    if (columns.length > 10) {
      console.log(`  ... and ${columns.length - 10} more columns`);
    }
  }
}

async function queryIndexes(_client: ReturnType<typeof getSupabaseClient>): Promise<void> {
  console.log('\n=== INDEXES ===\n');
  console.log('⚠️  Index query requires direct SQL access (pg_indexes).');
  console.log('   See migration files for expected indexes.');
  console.log('   Key indexes:');
  console.log('   • representatives_core: id (PK), openstates_id (unique), bioguide_id, canonical_id, state, level, is_active');
  console.log('   • civic_elections: election_id (PK), election_day, ocd_division_id');
  console.log('   • representative_divisions: representative_id');
  console.log('   • representative_activity: representative_id, type, action_date');
}

async function queryFunctions(client: ReturnType<typeof getSupabaseClient>): Promise<void> {
  console.log('\n=== FUNCTIONS & RPCs ===\n');

  // Test if functions exist by trying to call them (with safe parameters)
  const functionTests: Array<{ name: string; test: () => Promise<boolean> }> = [
    {
      name: 'sync_representatives_from_openstates',
      test: async () => {
        try {
          const { error } = await client.rpc('sync_representatives_from_openstates');
          // If we get a "function does not exist" error, it doesn't exist
          // If we get any other error (like "permission denied" or parameter error), it exists
          return error?.message?.includes('does not exist') === false;
        } catch {
          return false;
        }
      },
    },
    {
      name: 'deactivate_non_current_openstates_reps',
      test: async () => {
        try {
          const { error } = await client.rpc('deactivate_non_current_openstates_reps');
          return error?.message?.includes('does not exist') === false;
        } catch {
          return false;
        }
      },
    },
    {
      name: 'refresh_divisions_from_openstates',
      test: async () => {
        try {
          const { error } = await client.rpc('refresh_divisions_from_openstates');
          return error?.message?.includes('does not exist') === false;
        } catch {
          return false;
        }
      },
    },
    {
      name: 'get_upcoming_elections',
      test: async () => {
        try {
          const { error } = await client.rpc('get_upcoming_elections', { divisions: [] });
          return error?.message?.includes('does not exist') === false;
        } catch {
          return false;
        }
      },
    },
    {
      name: 'get_table_columns',
      test: async () => {
        try {
          const { error } = await client.rpc('get_table_columns', { target_table: 'representatives_core' });
          return error?.message?.includes('does not exist') === false;
        } catch {
          return false;
        }
      },
    },
  ];

  for (const { name, test } of functionTests) {
    const exists = await test();
    const icon = exists ? '✅' : '❌';
    console.log(`${icon} ${name}()`);
  }

  console.log('\n📝 Function definitions in migrations:');
  console.log('   • sync_representatives_from_openstates: 20251108023000_sync_representatives_function_v2.sql');
  console.log('   • deactivate_non_current_openstates_reps: 20260127120000_deactivate_non_current_reps.sql');
  console.log('   • refresh_divisions_from_openstates: 20251112092000_refresh_divisions_from_openstates.sql');
  console.log('   • get_upcoming_elections: 20251112090000_create_civic_elections.sql');
  console.log('   • get_table_columns: 20251108024500_create_get_table_columns_function.sql');
}

async function queryRLSPolicies(_client: ReturnType<typeof getSupabaseClient>): Promise<void> {
  console.log('\n=== RLS POLICIES ===\n');
  console.log('⚠️  RLS policy query requires direct SQL access (pg_policies).');
  console.log('   See migration files for expected policies.');
  console.log('   Expected pattern:');
  console.log('   • Public tables: SELECT for authenticated users, INSERT/UPDATE/DELETE for service role');
  console.log('   • Staging tables: Service role only');
  console.log('   • Key migrations:');
  console.log('     - 20251218000002_comprehensive_rls_policies.sql');
  console.log('     - 20251218000003_feedback_select_policy.sql');
  console.log('     - 20251218000004_polls_public_read.sql');
}

async function queryDataStats(client: ReturnType<typeof getSupabaseClient>): Promise<void> {
  console.log('\n=== DATA STATISTICS ===\n');

  for (const table of CIVICS_TABLES) {
    const { count, error } = await client
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn(`⚠️  ${table}: ${error.message}`);
      continue;
    }

    const icon = count === 0 ? '📭' : count! > 1000 ? '📦' : '📊';
    console.log(`${icon} ${table}: ${count ?? 0} rows`);
  }
}

async function queryActivityTypes(client: ReturnType<typeof getSupabaseClient>): Promise<void> {
  console.log('\n=== REPRESENTATIVE_ACTIVITY TYPE AUDIT ===\n');

  const { data, error } = await client
    .from('representative_activity')
    .select('type')
    .limit(10000);

  if (error) {
    console.warn(`⚠️  Could not query activity types: ${error.message}`);
    return;
  }

  const typeCounts = new Map<string, number>();
  for (const row of data ?? []) {
    const type = (row as { type?: string }).type ?? 'null';
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
  }

  if (typeCounts.size === 0) {
    console.log('📭 No activity records found');
    return;
  }

  console.log('Activity type distribution:');
  for (const [type, count] of Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])) {
    const icon = type === 'bill' ? '✅' : '⚠️';
    console.log(`  ${icon} ${type}: ${count} records`);
  }

  const nonBillCount = Array.from(typeCounts.entries())
    .filter(([type]) => type !== 'bill')
    .reduce((sum, [, count]) => sum + count, 0);

  if (nonBillCount > 0) {
    console.log(`\n⚠️  WARNING: ${nonBillCount} non-bill activity records found (should be removed per plan)`);
  }
}

async function main(): Promise<void> {
  const client = getSupabaseClient();
  console.log('🔍 Civics Ingest Flow Investigation\n');
  console.log('='.repeat(60));

  try {
    await querySchema(client, CIVICS_TABLES);
    await queryStagingSchema(client);
    await queryIndexes(client);
    await queryFunctions(client);
    await queryRLSPolicies(client);
    await queryDataStats(client);
    await queryActivityTypes(client);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Investigation complete. See CIVICS_INGEST_FLOW_INVESTIGATION.md for flow details.\n');
  } catch (error) {
    console.error('\n❌ Investigation failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
