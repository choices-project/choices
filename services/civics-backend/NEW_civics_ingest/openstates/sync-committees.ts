#!/usr/bin/env node
/**
 * Populate `representative_committees` from OpenStates role data.
 *
 * Usage:
 *   npm run openstates:sync:committees [--states=CA,NY] [--limit=500] [--dry-run]
 */
import 'dotenv/config';

import { collectActiveRepresentatives, type CollectOptions } from '../ingest/openstates/index.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import { fetchCommitteeAssignments } from '../enrich/committees.js';
import { syncRepresentativeCommittees } from '../persist/committees.js';
import { saveCheckpoint, loadCheckpoint, deleteCheckpoint } from '../utils/checkpoint.js';
import { getOpenStatesUsageStats } from '../clients/openstates.js';

type CliOptions = {
  states?: string[];
  limit?: number;
  dryRun?: boolean;
  resume?: boolean;
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
      case 'resume':
        options.resume = true;
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
  // OpenStates only has state/local data - never fetch federal reps (wastes API calls)
  const stateOptions: CollectOptions = {};
  if (options.states && options.states.length > 0) {
    stateOptions.states = options.states;
  }
  if (typeof options.limit === 'number') {
    stateOptions.limit = options.limit;
  }

  const reps = await collectActiveRepresentatives(stateOptions);
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

  // Checkpoint support
  const operationName = 'openstates-committees-sync';
  let startIndex = 0;
  let initialProcessed = 0;
  let initialAssignmentsCount = 0;
  let initialApiCount = 0;
  let initialYamlCount = 0;
  let initialErrorCount = 0;

  if (options.resume) {
    const checkpoint = await loadCheckpoint(operationName);
    if (checkpoint) {
      initialProcessed = checkpoint.processed ?? 0;
      initialAssignmentsCount = Number(checkpoint.metadata?.assignmentsCount) || 0;
      initialApiCount = Number(checkpoint.metadata?.apiCount) || 0;
      initialYamlCount = Number(checkpoint.metadata?.yamlCount) || 0;
      initialErrorCount = checkpoint.failed ?? 0;
      const lastId = checkpoint.lastProcessedId;
      if (typeof lastId === 'number') {
        const foundIdx = eligible.findIndex((r) => r.supabaseRepresentativeId === lastId);
        startIndex = foundIdx >= 0 ? foundIdx + 1 : 0;
      }
      console.log(`📋 Resuming from checkpoint: ${startIndex}/${eligible.length} (${initialProcessed} processed)`);
    }
  }

  let processed = initialProcessed;
  let assignmentsCount = initialAssignmentsCount;
  let apiCount = initialApiCount;
  let yamlCount = initialYamlCount;
  let errorCount = initialErrorCount;
  const errors: Array<{ rep: string; error: string }> = [];

  // Progress reporting
  const reportInterval = Math.max(1, Math.floor(eligible.length / 10)); // Report every 10%
  const checkpointInterval = 50; // Save checkpoint every 50 representatives

  for (let i = startIndex; i < eligible.length; i += 1) {
    const rep = eligible[i];
    try {
      const assignments = await fetchCommitteeAssignments(rep, { useAPI });
      await syncRepresentativeCommittees(rep, { assignments });
      processed += 1;
      assignmentsCount += assignments.length;
      apiCount += assignments.filter(a => a.source === 'openstates:api').length;
      yamlCount += assignments.filter(a => a.source === 'openstates:yaml').length;

      // Progress reporting
      if ((i + 1) % reportInterval === 0 || (i + 1) === eligible.length) {
        const percent = Math.round(((i + 1) / eligible.length) * 100);
        console.log(`   Progress: ${i + 1}/${eligible.length} (${percent}%) - ${assignmentsCount} assignments so far`);
      }

      // Save checkpoint periodically
      if ((i + 1) % checkpointInterval === 0) {
        const apiStats = getOpenStatesUsageStats();
        const repId = rep.supabaseRepresentativeId;
        if (typeof repId === 'number') {
          await saveCheckpoint(operationName, {
            total: eligible.length,
            processed: processed,
            failed: errorCount,
            lastProcessedId: repId,
            metadata: {
              assignmentsCount,
              apiCount,
              yamlCount,
              apiRemaining: apiStats.remaining,
            },
          });
        }
      }
    } catch (error) {
      errorCount += 1;
      const errorMsg = (error as Error).message;
      errors.push({ rep: `${rep.name} (${rep.supabaseRepresentativeId ?? 'unknown'})`, error: errorMsg });
      console.error(
        `Failed to sync committees for ${rep.name} (${rep.supabaseRepresentativeId ?? 'unknown id'}):`,
        errorMsg,
      );
    }
  }

  // Delete checkpoint on successful completion
  await deleteCheckpoint(operationName);

  const apiStats = getOpenStatesUsageStats();
  console.log(`✅ Committee sync complete (${processed}/${eligible.length}). Rows written: ${assignmentsCount}.`);
  if (useAPI) {
    console.log(`   API: ${apiCount}, YAML: ${yamlCount}`);
  }
  console.log(`   API usage: ${apiStats.dailyRequests}/${apiStats.dailyLimit} (${apiStats.remaining} remaining)`);
  if (errorCount > 0) {
    console.log(`   ⚠️  Errors: ${errorCount}`);
    if (errors.length <= 10) {
      errors.forEach(e => console.log(`      - ${e.rep}: ${e.error}`));
    } else {
      console.log(`      (Showing first 10 of ${errors.length} errors)`);
      errors.slice(0, 10).forEach(e => console.log(`      - ${e.rep}: ${e.error}`));
    }
  }
}

main().catch((error) => {
  console.error('Committee sync failed:', error);
  process.exit(1);
});


