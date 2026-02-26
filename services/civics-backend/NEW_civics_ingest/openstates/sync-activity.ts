#!/usr/bin/env node
/**
 * Populate `representative_activity` with OpenStates bill activity.
 *
 * Usage:
 *   npm run openstates:sync:activity [--resume] [--max-reps=1500] [--states=CA,NY] [--limit=200] [--dry-run]
 *
 * For rate-limit-aware re-ingest (run daily when limit resets):
 *   npm run openstates:sync:activity -- --resume --max-reps=1500
 */
import { loadEnv } from '../utils/load-env.js';
loadEnv();

import { getOpenStatesUsageStats } from '../clients/openstates.js';
import { logger } from '../utils/logger.js';
import { syncActivityForRepresentatives, type ActivitySyncOptions } from '../workflows/activity-sync.js';

type CliOptions = {
  states?: string[];
  limit?: number;
  dryRun?: boolean;
  resume?: boolean;
  maxReps?: number;
};

function parseArgs(): CliOptions {
  const options: CliOptions = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg || !arg.startsWith('--')) continue;

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
        if (value) options.limit = Number(value);
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      case 'resume':
        options.resume = true;
        break;
      case 'max-reps':
        if (value) options.maxReps = Number(value);
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

async function main() {
  const options = parseArgs();

  // For rate-limit-aware runs: use env OPENSTATES_ACTIVITY_MAX_REPS or derive from remaining - reserve
  let maxReps = options.maxReps ?? Number(process.env.OPENSTATES_ACTIVITY_MAX_REPS || '0');
  if (maxReps <= 0 && process.env.OPENSTATES_BUDGET_AWARE === '1') {
    const stats = getOpenStatesUsageStats();
    const reserve = 100;
    maxReps = Math.max(0, stats.remaining - reserve);
    if (maxReps > 0) {
      logger.info(`Budget-aware: max ${maxReps} reps this run (${stats.remaining} - ${reserve} reserve)`);
    }
  }

  const syncOptions: ActivitySyncOptions = {
    ...options,
    maxReps: maxReps > 0 ? maxReps : undefined,
  };

  const result = await syncActivityForRepresentatives(syncOptions);
  if (result.dryRun) {
    logger.info(
      `[dry-run] Would sync activity entries for ${result.total} representatives (total bills: ${result.activityRows}).`,
    );
  } else {
    logger.info(
      `Activity sync complete (${result.processed}/${result.total}, failed: ${result.failed}, rate limited: ${result.rateLimited}). Activity rows written: ${result.activityRows}.`,
    );
    if (result.apiUsage) {
      logger.info(
        `API usage: ${result.apiUsage.dailyRequests}/${result.apiUsage.dailyLimit} (${result.apiUsage.remaining} remaining)`,
      );
    }
  }
}

main().catch((error) => {
  logger.error('Activity sync failed', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});


