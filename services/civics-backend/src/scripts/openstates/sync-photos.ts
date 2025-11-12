#!/usr/bin/env node
/**
 * Normalize and persist representative photo records into Supabase.
 *
 * Usage:
 *   npm run openstates:sync:photos [--states=CA,NY] [--limit=500] [--dry-run]
 */
import 'dotenv/config';

import { collectActiveRepresentatives, type CollectOptions } from '../../ingest/openstates/index.js';
import { fetchFederalRepresentatives, type FetchFederalOptions } from '../../ingest/supabase/representatives.js';
import type { CanonicalRepresentative } from '../../ingest/openstates/people.js';
import { syncRepresentativePhotos } from '../../persist/photos.js';

type CliOptions = {
  states?: string[];
  limit?: number;
  dryRun?: boolean;
};

function parseArgs(): CliOptions {
  const options: CliOptions = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg) continue;
    if (!arg.startsWith('--')) continue;

    const [flag, raw] = arg.includes('=') ? arg.slice(2).split('=') : [arg.slice(2), args[i + 1]];
    const value = raw && !raw.startsWith('--') ? raw : undefined;

    switch (flag) {
      case 'states':
        if (value) {
          options.states = value
            .split(',')
            .map((state) => state.trim().toUpperCase())
            .filter(Boolean);
        }
        break;
      case 'limit':
        if (value) {
          options.limit = Number(value);
        }
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      default:
        break;
    }

    if (raw && !arg.includes('=')) {
      i += 1;
    }
  }

  return options;
}

function dedupeRepresentatives(reps: CanonicalRepresentative[]): CanonicalRepresentative[] {
  const seenIds = new Set<number>();
  const fallbackKeys = new Set<string>();
  const result: CanonicalRepresentative[] = [];

  for (const rep of reps) {
    const supabaseId = rep.supabaseRepresentativeId ?? undefined;
    if (supabaseId && seenIds.has(supabaseId)) {
      continue;
    }
    if (!supabaseId) {
      if (fallbackKeys.has(rep.canonicalKey)) continue;
      fallbackKeys.add(rep.canonicalKey);
    } else {
      seenIds.add(supabaseId);
    }
    result.push(rep);
  }

  return result;
}

async function loadRepresentatives(options: CliOptions): Promise<CanonicalRepresentative[]> {
  const federalOptions: FetchFederalOptions = {};
  if (options.states && options.states.length > 0) {
    federalOptions.states = options.states;
  }

  const stateOptions: CollectOptions = {};
  if (options.states && options.states.length > 0) {
    stateOptions.states = options.states;
  }
  if (typeof options.limit === 'number') {
    stateOptions.limit = options.limit;
  }

  const [federalReps, stateReps] = await Promise.all([
    fetchFederalRepresentatives(federalOptions),
    collectActiveRepresentatives(stateOptions),
  ]);

  return dedupeRepresentatives([...federalReps, ...stateReps]);
}

async function main() {
  const options = parseArgs();
  const reps = await loadRepresentatives(options);

  const eligible = reps.filter((rep) => rep.supabaseRepresentativeId != null);
  if (eligible.length === 0) {
    console.log('No representatives with Supabase IDs found; nothing to sync.');
    return;
  }

  if (options.dryRun) {
    console.log(
      `[dry-run] Would sync photos for ${eligible.length} representatives${
        options.states?.length ? ` in ${options.states.join(', ')}` : ''
      }.`,
    );
    return;
  }

  console.log(
    `Syncing photos for ${eligible.length} representatives${
      options.states?.length ? ` filtered by ${options.states.join(', ')}` : ''
    }...`,
  );

  let succeeded = 0;
  for (const rep of eligible) {
    try {
      await syncRepresentativePhotos(rep);
      succeeded += 1;
    } catch (error) {
      console.error(
        `Failed to sync photos for ${rep.name} (${rep.supabaseRepresentativeId ?? 'unknown id'}):`,
        (error as Error).message,
      );
    }
  }

  console.log(`✅ Photo sync complete (${succeeded}/${eligible.length}).`);
}

main().catch((error) => {
  console.error('Photo sync failed:', error);
  process.exit(1);
});

