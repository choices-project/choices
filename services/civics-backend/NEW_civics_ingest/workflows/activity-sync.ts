import { fetchRecentBillsForPerson, getOpenStatesUsageStats } from '../clients/openstates.js';
import { deriveJurisdictionFilter } from '../enrich/state.js';
import { collectActiveRepresentatives, type CollectOptions } from '../ingest/openstates/index.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import { syncRepresentativeActivity } from '../persist/activity.js';
import { saveCheckpoint, loadCheckpoint, deleteCheckpoint } from '../utils/checkpoint.js';

export interface ActivitySyncOptions {
  states?: string[];
  limit?: number;
  dryRun?: boolean;
  resume?: boolean;
  logger?: Pick<typeof console, 'log' | 'warn' | 'error'>;
}

interface ActivitySyncResult {
  total: number;
  processed: number;
  failed: number;
  rateLimited: number;
  activityRows: number;
  dryRun: boolean;
  apiUsage?: {
    dailyRequests: number;
    dailyLimit: number;
    remaining: number;
  };
}

const DEFAULT_ACTIVITY_LIMIT = Number(process.env.OPENSTATES_ACTIVITY_LIMIT ?? '8');

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

async function loadRepresentatives(options: ActivitySyncOptions): Promise<CanonicalRepresentative[]> {
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

export async function syncActivityForRepresentatives(
  options: ActivitySyncOptions = {},
): Promise<ActivitySyncResult> {
  const logger = options.logger ?? console;
  const operationName = 'openstates-activity-sync';

  // Load checkpoint if resuming
  let startIndex = 0;
  let initialProcessed = 0;
  let initialFailed = 0;
  let initialActivityRows = 0;
  let initialRateLimited = 0;

  if (options.resume) {
    const checkpoint = await loadCheckpoint(operationName);
    if (checkpoint) {
      logger.log(`Resuming from checkpoint: ${checkpoint.processed}/${checkpoint.total} processed`);
      initialProcessed = checkpoint.processed;
      initialFailed = checkpoint.failed;
      initialActivityRows = checkpoint.metadata?.activityRows as number || 0;
      initialRateLimited = checkpoint.metadata?.rateLimited as number || 0;
      startIndex = checkpoint.processed;
    }
  }

  const reps = await loadRepresentatives(options);
  const eligible = reps.filter((rep) => rep.supabaseRepresentativeId != null);

  if (eligible.length === 0) {
    logger.log('No representatives with Supabase IDs found; nothing to sync.');
    return {
      total: 0,
      processed: 0,
      failed: 0,
      rateLimited: 0,
      activityRows: 0,
      dryRun: Boolean(options.dryRun),
    };
  }

  const limit = DEFAULT_ACTIVITY_LIMIT;
  const dryRun = Boolean(options.dryRun);

  let processed = initialProcessed;
  let failed = initialFailed;
  let activityRows = initialActivityRows;
  let rateLimited = initialRateLimited;

  // Check initial API usage
  const initialStats = getOpenStatesUsageStats();
  if (initialStats.remaining <= 0) {
    logger.warn(
      `OpenStates API daily limit reached (${initialStats.dailyRequests}/${initialStats.dailyLimit}). Cannot proceed.`,
    );
    return {
      total: eligible.length,
      processed: 0,
      failed: eligible.length,
      rateLimited: 0,
      activityRows: 0,
      dryRun,
    };
  }

  // Filter to unprocessed reps if resuming
  const repsToProcess = options.resume && startIndex > 0
    ? eligible.slice(startIndex)
    : eligible;

  if (startIndex === 0) {
    logger.log(
      `Starting activity sync for ${eligible.length} representatives. API usage: ${initialStats.dailyRequests}/${initialStats.dailyLimit} (${initialStats.remaining} remaining)`,
    );
  } else {
    logger.log(
      `Resuming activity sync from index ${startIndex}/${eligible.length}. API usage: ${initialStats.dailyRequests}/${initialStats.dailyLimit} (${initialStats.remaining} remaining)`,
    );
  }

  for (let i = 0; i < repsToProcess.length; i += 1) {
    const actualIndex = startIndex + i;
    const rep = repsToProcess[i];

    // Check API usage periodically
    if (actualIndex % 10 === 0 && actualIndex > 0) {
      const stats = getOpenStatesUsageStats();
      if (stats.remaining <= 0) {
        logger.warn(
          `OpenStates API daily limit reached after ${actualIndex} representatives. Stopping sync. Processed: ${processed}, Failed: ${failed}, Rate limited: ${rateLimited}`,
        );
        break;
      }
      logger.log(
        `Progress: ${actualIndex}/${eligible.length} (${Math.round((actualIndex / eligible.length) * 100)}%). API usage: ${stats.dailyRequests}/${stats.dailyLimit} (${stats.remaining} remaining)`,
      );
    }

    try {
      const jurisdiction = deriveJurisdictionFilter(rep);
      const fetchOptions: { limit: number; jurisdiction?: string; query?: string } = { limit };
      if (jurisdiction) fetchOptions.jurisdiction = jurisdiction;
      // Use fallback query if no openstatesId but have name
      if (!rep.openstatesId && rep.name) {
        fetchOptions.query = rep.name;
      } else if (rep.openstatesId) {
        // Will use person ID in fetchRecentBillsForPerson
      }

      const bills = await fetchRecentBillsForPerson(rep.openstatesId || null, fetchOptions);

      if (!dryRun) {
        await syncRepresentativeActivity(rep, { bills });
      }
      activityRows += bills.length;
      processed += 1;
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Check if it's a rate limit error
      if (
        errorMessage.includes('429') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('daily limit')
      ) {
        rateLimited += 1;
        logger.warn(
          `Rate limited for ${rep.name} (${rep.supabaseRepresentativeId ?? 'unknown id'}): ${errorMessage}`,
        );

        // If we hit daily limit, stop processing
        if (errorMessage.includes('daily limit')) {
          logger.warn(
            `Daily limit reached. Stopping sync. Processed: ${processed}, Failed: ${failed}, Rate limited: ${rateLimited}`,
          );
          break;
        }
      } else {
        failed += 1;
        logger.error(
          `Failed to sync activity for ${rep.name} (${rep.supabaseRepresentativeId ?? 'unknown id'}):`,
          errorMessage,
        );
      }
    }

    // Save checkpoint every 50 representatives
    const currentIndex = startIndex + i;
    if (currentIndex > 0 && currentIndex % 50 === 0 && !dryRun) {
      try {
        await saveCheckpoint(operationName, {
          total: eligible.length,
          processed,
          failed,
          rateLimited,
          lastProcessedId: rep.supabaseRepresentativeId ?? undefined,
          metadata: {
            startedAt: new Date().toISOString(),
            activityRows,
            rateLimited,
          },
        });
      } catch (checkpointError) {
        // Don't fail the sync if checkpoint save fails
        logger.warn(`Failed to save checkpoint: ${(checkpointError as Error).message}`);
      }
    }
  }

  // Final stats
  const finalStats = getOpenStatesUsageStats();

  // Delete checkpoint if completed successfully
  if (processed >= eligible.length && !dryRun) {
    try {
      await deleteCheckpoint(operationName);
    } catch (checkpointError) {
      // Don't fail if checkpoint delete fails
      logger.warn(`Failed to delete checkpoint: ${(checkpointError as Error).message}`);
    }
  }

  logger.log(
    `Activity sync complete. Processed: ${processed}/${eligible.length}, Failed: ${failed}, Rate limited: ${rateLimited}, Activity rows: ${activityRows}. Final API usage: ${finalStats.dailyRequests}/${finalStats.dailyLimit} (${finalStats.remaining} remaining)`,
  );
  return {
    total: eligible.length,
    processed,
    failed,
    rateLimited,
    activityRows,
    dryRun,
    apiUsage: {
      dailyRequests: finalStats.dailyRequests,
      dailyLimit: finalStats.dailyLimit,
      remaining: finalStats.remaining,
    },
  };
}


