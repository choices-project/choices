#!/usr/bin/env node
/**
 * Repair corrupted canonical/crosswalk records that collapsed into a shared canonical ID.
 *
 * Strategy:
 * 1. Pull every `representatives_core` row that still points to the corrupted canonical ID.
 * 2. Derive a stable canonical ID per record (bioguide > fec > name).
 * 3. Update `representatives_core` with the new canonical ID.
 * 4. Move matching crosswalk links (fec/bioguide/congress-gov) from the corrupted canonical
 *    to the new canonical, removing the stale association.
 * 5. Optionally delete any remaining orphaned crosswalk rows for the corrupted canonical ID.
 *
 * Run via:
 *   npm run fix:crosswalk
 */
import 'dotenv/config';

import { getSupabaseClient } from '../clients/supabase.js';

const CORRUPTED_CANONICAL_ID = 'person_george_whitesides_California_27';

interface RepresentativeRecord {
  id: number;
  name: string;
  state: string | null;
  district: string | null;
  canonical_id: string | null;
  bioguide_id: string | null;
  fec_id: string | null;
  congress_gov_id: string | null;
  wikipedia_url: string | null;
  ballotpedia_url: string | null;
}

interface CrosswalkEntry {
  canonical_id: string;
  source: string;
  source_id: string | null;
}

function slugifyName(name: string | null | undefined): string {
  return (name ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function deriveCanonicalId(rep: RepresentativeRecord): string {
  if (rep.bioguide_id) {
    return `bioguide:${rep.bioguide_id}`;
  }
  if (rep.fec_id) {
    return `fec:${rep.fec_id}`;
  }
  const nameSlug = slugifyName(rep.name);
  const state = rep.state ?? 'unknown';
  const district = rep.district ?? 'at-large';
  return `name:${state}:${nameSlug || 'unknown'}:${district}`;
}

async function fetchCorruptedRepresentatives(client = getSupabaseClient()) {
  const { data, error } = await client
    .from('representatives_core')
    .select(
      'id,name,state,district,canonical_id,bioguide_id,fec_id,congress_gov_id,wikipedia_url,ballotpedia_url',
    )
    .eq('canonical_id', CORRUPTED_CANONICAL_ID);

  if (error) {
    throw new Error(`Failed to fetch corrupted representatives: ${error.message}`);
  }
  return (data ?? []) as RepresentativeRecord[];
}

async function fetchCrosswalkEntries(
  canonicalId: string,
  client = getSupabaseClient(),
) {
  const { data, error } = await client
    .from('id_crosswalk')
    .select('canonical_id, source, source_id')
    .eq('canonical_id', canonicalId);

  if (error) {
    throw new Error(`Failed to fetch crosswalk entries for ${canonicalId}: ${error.message}`);
  }
  return (data ?? []) as CrosswalkEntry[];
}

function relevantSources(rep: RepresentativeRecord) {
  const items: Array<{ source: string; source_id: string }> = [];
  if (rep.bioguide_id) {
    items.push({ source: 'bioguide', source_id: rep.bioguide_id });
  }
  if (rep.fec_id) {
    items.push({ source: 'fec', source_id: rep.fec_id });
  }
  if (rep.congress_gov_id) {
    items.push({ source: 'congress-gov', source_id: rep.congress_gov_id });
  }
  return items;
}

async function migrateCrosswalkLinks(
  rep: RepresentativeRecord,
  newCanonicalId: string,
  crosswalkEntries: CrosswalkEntry[],
  client = getSupabaseClient(),
) {
  const targets = relevantSources(rep);
  if (targets.length === 0) return;

  for (const target of targets) {
    // Only migrate entries that truly belong to this representative
    const existing = crosswalkEntries.find((entry) => {
      return (
        entry.source === target.source &&
        entry.source_id &&
        entry.source_id.toLowerCase() === target.source_id.toLowerCase()
      );
    });

    const source = existing?.source ?? target.source;
    const sourceId = existing?.source_id ?? target.source_id;

    if (existing) {
      console.log(
        `  ↳ re-linking ${source}:${sourceId} → ${newCanonicalId}`,
      );

      const deleteResult = await client
        .from('id_crosswalk')
        .delete()
        .match({
          canonical_id: CORRUPTED_CANONICAL_ID,
          source: existing.source,
          source_id: existing.source_id,
        });

      if (deleteResult.error) {
        throw new Error(
          `Failed to delete crosswalk entry ${existing.source}:${existing.source_id}: ${deleteResult.error.message}`,
        );
      }
    } else {
      console.log(
        `  ↳ creating new link ${source}:${sourceId} → ${newCanonicalId}`,
      );
    }

    const attrs: Record<string, unknown> = {
      migrated_at: new Date().toISOString(),
    };
    if (existing) {
      attrs.prev_canonical = CORRUPTED_CANONICAL_ID;
    }

    const upsertResult = await client.from('id_crosswalk').upsert(
      {
        canonical_id: newCanonicalId,
        source,
        source_id: sourceId,
        entity_type: 'person',
        attrs,
      },
      { onConflict: 'source,source_id' },
    );

    if (upsertResult.error) {
      throw new Error(
        `Failed to upsert crosswalk entry ${source}:${sourceId}: ${upsertResult.error.message}`,
      );
    }

    if (existing) {
      const idx = crosswalkEntries.indexOf(existing);
      if (idx >= 0) {
        crosswalkEntries.splice(idx, 1);
      }
    }
  }
}

async function cleanupResidualCrosswalk(client = getSupabaseClient()) {
  const { error } = await client
    .from('id_crosswalk')
    .delete()
    .eq('canonical_id', CORRUPTED_CANONICAL_ID);

  if (error) {
    throw new Error(`Failed to delete residual crosswalk entries: ${error.message}`);
  }
}

async function main() {
  const client = getSupabaseClient();
  const reps = await fetchCorruptedRepresentatives(client);

  if (reps.length === 0) {
    console.log('✅ No representatives still reference the corrupted canonical ID.');
    return;
  }

  console.log(
    `Found ${reps.length} representatives sharing ${CORRUPTED_CANONICAL_ID}; migrating...`,
  );

  const crosswalkEntries = await fetchCrosswalkEntries(CORRUPTED_CANONICAL_ID, client);

  for (const rep of reps) {
    const newCanonicalId = deriveCanonicalId(rep);
    if (newCanonicalId === rep.canonical_id) {
      continue;
    }

    console.log(`• Updating representative ${rep.id} (${rep.name}) → ${newCanonicalId}`);

    const updateResult = await client
      .from('representatives_core')
      .update({ canonical_id: newCanonicalId })
      .eq('id', rep.id);

    if (updateResult.error) {
      throw new Error(
        `Failed to update representative ${rep.id}: ${updateResult.error.message}`,
      );
    }

    await migrateCrosswalkLinks(rep, newCanonicalId, crosswalkEntries, client);
  }

  console.log('Removing any remaining crosswalk links referencing the corrupted canonical ID...');
  await cleanupResidualCrosswalk(client);

  console.log('✅ Migration complete. Re-run `npm run audit:crosswalk` to verify.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Crosswalk repair failed:', error);
    process.exit(1);
  });
}

