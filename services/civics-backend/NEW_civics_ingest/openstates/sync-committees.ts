#!/usr/bin/env node
/**
 * Populate `representative_committees` from OpenStates role data.
 *
 * Usage:
 *   npm run openstates:sync:committees [--states=CA,NY] [--limit=500] [--dry-run]
 */
import 'dotenv/config';

import { collectActiveRepresentatives, type CollectOptions } from '../ingest/openstates/index.js';
import { fetchFederalRepresentatives, type FetchFederalOptions } from '../ingest/supabase/representatives.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import { fetchCommitteeAssignments } from '../enrich/committees.js';
import { syncRepresentativeCommittees } from '../persist/committees.js';

type CliOptions = {
  states?: string[];
  limit?: number;
  dryRun?: boolean;
  includeFederalOnly?: boolean;
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
      case 'federal-only':
        options.includeFederalOnly = true;
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

  const reps: CanonicalRepresentative[] = [];

  const federalReps = await fetchFederalRepresentatives(federalOptions);
  reps.push(...federalReps);

  if (!options.includeFederalOnly) {
    const stateOptions: CollectOptions = {};
    if (options.states && options.states.length > 0) {
      stateOptions.states = options.states;
    }
    if (typeof options.limit === 'number') {
      stateOptions.limit = options.limit;
    }

    const stateReps = await collectActiveRepresentatives(stateOptions);
    reps.push(...stateReps);
  }

  if (typeof options.limit === 'number') {
    return dedupeRepresentatives(reps).slice(0, options.limit);
  }

  return dedupeRepresentatives(reps);
}

async function main() {
  const options = parseArgs();
  const reps = await loadRepresentatives(options);

  const eligible = reps.filter((rep) => rep.supabaseRepresentativeId != null);
  if (eligible.length === 0) {
    console.log('No representatives with Supabase IDs found; nothing to sync.');
    return;
  }

  // Use API by default to get current committee data (supplements YAML)
  const useAPI = process.env.OPENSTATES_USE_API_COMMITTEES !== 'false';

  if (options.dryRun) {
    let totalAssignments = 0;
    let apiAssignments = 0;
    let yamlAssignments = 0;
    for (const rep of eligible) {
      const assignments = await fetchCommitteeAssignments(rep, { useAPI });
      if (assignments.length > 0) {
        totalAssignments += assignments.length;
        const apiCount = assignments.filter(a => a.source === 'openstates:api').length;
        apiAssignments += apiCount;
        yamlAssignments += assignments.length - apiCount;
      }
    }

    console.log(
      `[dry-run] Would sync committee assignments for ${eligible.length} representatives (total rows: ${totalAssignments}).`,
    );
    if (useAPI) {
      console.log(`   API assignments: ${apiAssignments}, YAML assignments: ${yamlAssignments}`);
    }
    return;
  }

  console.log(
    `Syncing committee assignments for ${eligible.length} representatives${options.states?.length ? ` filtered by ${options.states.join(', ')}` : ''}...`,
  );
  if (useAPI) {
    console.log('   Using OpenStates API to supplement YAML data (current committees)...');
  } else {
    console.log('   Using YAML data only (API disabled)...');
  }

  let processed = 0;
  let assignmentsCount = 0;
  let apiCount = 0;
  let yamlCount = 0;
  for (const rep of eligible) {
    try {
      const assignments = await fetchCommitteeAssignments(rep, { useAPI });
      await syncRepresentativeCommittees(rep, { assignments });
      processed += 1;
      assignmentsCount += assignments.length;
      apiCount += assignments.filter(a => a.source === 'openstates:api').length;
      yamlCount += assignments.filter(a => a.source === 'openstates:yaml').length;
    } catch (error) {
      console.error(
        `Failed to sync committees for ${rep.name} (${rep.supabaseRepresentativeId ?? 'unknown id'}):`,
        (error as Error).message,
      );
    }
  }

  console.log(`✅ Committee sync complete (${processed}/${eligible.length}). Rows written: ${assignmentsCount}.`);
  if (useAPI) {
    console.log(`   API: ${apiCount}, YAML: ${yamlCount}`);
  }
}

main().catch((error) => {
  console.error('Committee sync failed:', error);
  process.exit(1);
});


