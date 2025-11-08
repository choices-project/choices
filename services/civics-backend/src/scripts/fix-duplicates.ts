#!/usr/bin/env node
import 'dotenv/config';

import { getSupabaseClient } from '../clients/supabase.js';

interface DuplicateCanonicalRow {
  canonical_id: string;
  ids: number[];
}

function parseOptions(): { apply: boolean; force: boolean; canonicalId?: string } {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const force = args.includes('--force');
  const canonicalArg = args.find((arg) => arg.startsWith('--canonical='));

  const options: { apply: boolean; force: boolean; canonicalId?: string } = { apply, force };
  if (canonicalArg) {
    const [, value] = canonicalArg.split('=');
    if (value) {
      options.canonicalId = value;
    }
  }

  return options;
}

async function fetchDuplicates(): Promise<DuplicateCanonicalRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('get_duplicate_canonical_ids');
  if (error) {
    throw new Error(`Failed to fetch duplicate canonicals: ${error.message}`);
  }
  return (data ?? []) as DuplicateCanonicalRow[];
}

async function countDependents(repId: number, client = getSupabaseClient()): Promise<Map<string, number>> {
  const tables = [
    { table: 'representative_contacts', column: 'representative_id' },
    { table: 'representative_social_media', column: 'representative_id' },
    { table: 'representative_photos', column: 'representative_id' },
    { table: 'representative_committees', column: 'representative_id' },
    { table: 'representative_campaign_finance', column: 'representative_id' },
    { table: 'representative_data_sources', column: 'representative_id' },
    { table: 'representative_data_quality', column: 'representative_id' },
    { table: 'representative_crosswalk_enhanced', column: 'representative_id' },
  ] as const;

  const result = new Map<string, number>();
  for (const entry of tables) {
    const { count, error } = await client
      .from(entry.table)
      .select(entry.column, { head: true, count: 'exact' })
      .eq(entry.column, repId);
    if (error) {
      throw new Error(`Failed to inspect ${entry.table} for representative ${repId}: ${error.message}`);
    }
    result.set(entry.table, count ?? 0);
  }

  return result;
}

async function migrateCrosswalkEntries(fromId: number, toId: number, client = getSupabaseClient()) {
  const { error } = await client
    .from('representative_crosswalk_enhanced')
    .update({ representative_id: toId })
    .eq('representative_id', fromId);
  if (error) {
    throw new Error(
      `Failed to migrate crosswalk entries from representative ${fromId} to ${toId}: ${error.message}`,
    );
  }
}

async function deleteRepresentatives(ids: number[], client = getSupabaseClient()) {
  if (ids.length === 0) return;
  const { error } = await client.from('representatives_core').delete().in('id', ids);
  if (error) {
    throw new Error(`Failed to delete duplicate representatives ${ids.join(', ')}: ${error.message}`);
  }
}

async function main(): Promise<void> {
  const options = parseOptions();
  const duplicates = await fetchDuplicates();

  const filtered = options.canonicalId
    ? duplicates.filter((duplicate) => duplicate.canonical_id === options.canonicalId)
    : duplicates;

  if (filtered.length === 0) {
    console.log('✅ No duplicate canonical IDs to process.');
    return;
  }

  const client = getSupabaseClient();
  let totalDeleted = 0;
  let blocked = 0;

  for (const group of filtered) {
    const ids = [...(group.ids ?? [])].sort((a, b) => a - b);
    if (ids.length < 2) continue;

    const keepId = ids[0];
    if (keepId === undefined) continue;
    const candidates = ids.slice(1);

    console.log(`\nCanonical ${group.canonical_id}`);
    console.log(`  Keeping representative ${keepId}`);

    const deletable: number[] = [];
    for (const repId of candidates) {
      const dependentCounts = await countDependents(repId, client);
      const hasDependents = Array.from(dependentCounts.values()).some((value) => value > 0);

      if (hasDependents && !options.force) {
        console.warn(
          `  ⚠️ Skipping representative ${repId} because dependent records exist (${Array.from(
            dependentCounts.entries(),
          )
            .filter(([, value]) => value > 0)
            .map(([table, value]) => `${table}:${value}`)
            .join(', ')})`,
        );
        blocked += 1;
        continue;
      }

      if (hasDependents && options.force) {
        console.warn(
          `  ⚠️ Representative ${repId} has dependent records but --force was supplied; records will be deleted.`,
        );
      }

      await migrateCrosswalkEntries(repId, keepId, client);
      deletable.push(repId);
    }

    if (deletable.length === 0) {
      console.log('  No duplicate rows eligible for deletion in this group.');
      continue;
    }

    if (!options.apply) {
      console.log(`  (dry-run) Would delete representatives: ${deletable.join(', ')}`);
      continue;
    }

    await deleteRepresentatives(deletable, client);
    console.log(`  ✅ Deleted duplicates: ${deletable.join(', ')}`);
    totalDeleted += deletable.length;
  }

  if (!options.apply) {
    console.log('\nDry run complete. Re-run with --apply to delete the duplicates listed above.');
  } else {
    console.log(`\n✔️ Deleted ${totalDeleted} duplicate representative row(s).`);
  }

  if (blocked > 0) {
    console.log(
      `\n⚠️ ${blocked} representative(s) were skipped because dependent records exist. Review manually or rerun with --force if you are confident deleting related data is safe.`,
    );
    process.exitCode = options.apply ? 0 : 1;
  }
}

main().catch((error) => {
  console.error('Duplicate canonical fix failed:', error);
  process.exit(1);
});

