#!/usr/bin/env node
/**
 * Master script to sync all OpenStates data for STATE/LOCAL representatives.
 * 
 * NOTE: OpenStates only covers state and local representatives, NOT federal.
 * Federal data comes from Congress.gov, FEC, and GovInfo.
 * 
 * Runs all sync operations in the correct order:
 * 1. Contacts (no API calls, from YAML)
 * 2. Social media (no API calls, from YAML)
 * 3. Photos (no API calls, from YAML)
 * 4. Data sources (no API calls, from YAML)
 * 5. Committees (no API calls, from YAML - could enhance with API)
 * 6. Activity (uses OpenStates API - rate limited)
 * 7. Events (uses OpenStates API - optional, can skip with --skip-events)
 * 
 * Usage:
 *   npm run openstates:sync:all [--states=CA,NY] [--limit=500] [--dry-run] [--skip-activity] [--skip-events]
 */

import { loadEnv } from '../utils/load-env.js';
loadEnv();

import { collectActiveRepresentatives, type CollectOptions } from '../ingest/openstates/index.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import { syncRepresentativeContacts } from '../persist/contacts.js';
import { syncRepresentativeSocial } from '../persist/social.js';
import { syncRepresentativePhotos } from '../persist/photos.js';
import { syncRepresentativeDataSources } from '../persist/data-sources.js';
import {
  fetchCommitteeAssignments,
  buildCommitteesCache,
  type CommitteesByJurisdictionCache,
} from '../enrich/committees.js';
import { syncRepresentativeCommittees } from '../persist/committees.js';
import { syncActivityForRepresentatives, type ActivitySyncOptions } from '../workflows/activity-sync.js';
import { logger } from '../utils/logger.js';

type CliOptions = {
  states?: string[];
  limit?: number;
  dryRun?: boolean;
  skipActivity?: boolean;
  skipEvents?: boolean;
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
        if (value) {
          options.limit = Number(value);
        }
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      case 'skip-activity':
        options.skipActivity = true;
        break;
      case 'skip-events':
        options.skipEvents = true;
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

async function loadRepresentatives(options: CliOptions): Promise<CanonicalRepresentative[]> {
  // OpenStates only covers state/local representatives, not federal
  const stateOptions: CollectOptions = {};
  if (options.states && options.states.length > 0) {
    stateOptions.states = options.states;
  }
  if (typeof options.limit === 'number') {
    stateOptions.limit = options.limit;
  }

  const stateReps = await collectActiveRepresentatives(stateOptions);
  
  if (typeof options.limit === 'number') {
    return stateReps.slice(0, options.limit);
  }

  return stateReps;
}

interface SyncResult {
  name: string;
  succeeded: number;
  failed: number;
  details?: Record<string, unknown>;
}

async function syncContacts(reps: CanonicalRepresentative[], dryRun: boolean): Promise<SyncResult> {
  logger.info('\n📞 Syncing contacts...');
  let succeeded = 0;
  let failed = 0;
  let totalAdded = 0;
  let totalSkipped = 0;

  for (const rep of reps) {
    try {
      if (dryRun) {
        succeeded += 1;
        continue;
      }
      const result = await syncRepresentativeContacts(rep);
      if (result.success) {
        succeeded += 1;
        totalAdded += result.contactsAdded;
        totalSkipped += result.contactsSkipped;
      } else {
        failed += 1;
        totalSkipped += result.contactsSkipped;
      }
    } catch (error) {
      failed += 1;
      logger.error(`Failed for ${rep.name}`, { error: (error as Error).message });
    }
  }

  return {
    name: 'Contacts',
    succeeded,
    failed,
    details: { totalAdded, totalSkipped },
  };
}

async function syncSocial(reps: CanonicalRepresentative[], dryRun: boolean): Promise<SyncResult> {
  logger.info('\n📱 Syncing social media...');
  let succeeded = 0;
  let failed = 0;

  for (const rep of reps) {
    try {
      if (!dryRun) {
        await syncRepresentativeSocial(rep);
      }
      succeeded += 1;
    } catch (error) {
      failed += 1;
      logger.error(`Failed for ${rep.name}`, { error: (error as Error).message });
    }
  }

  return { name: 'Social Media', succeeded, failed };
}

async function syncPhotos(reps: CanonicalRepresentative[], dryRun: boolean): Promise<SyncResult> {
  logger.info('\n📷 Syncing photos...');
  let succeeded = 0;
  let failed = 0;

  for (const rep of reps) {
    try {
      if (!dryRun) {
        await syncRepresentativePhotos(rep);
      }
      succeeded += 1;
    } catch (error) {
      failed += 1;
      logger.error(`Failed for ${rep.name}`, { error: (error as Error).message });
    }
  }

  return { name: 'Photos', succeeded, failed };
}

async function syncDataSources(reps: CanonicalRepresentative[], dryRun: boolean): Promise<SyncResult> {
  logger.info('\n📊 Syncing data sources...');
  let succeeded = 0;
  let failed = 0;

  for (const rep of reps) {
    try {
      if (!dryRun) {
        await syncRepresentativeDataSources(rep);
      }
      succeeded += 1;
    } catch (error) {
      failed += 1;
      logger.error(`Failed for ${rep.name}`, { error: (error as Error).message });
    }
  }

  return { name: 'Data Sources', succeeded, failed };
}

async function syncCommittees(
  reps: CanonicalRepresentative[],
  dryRun: boolean,
): Promise<SyncResult> {
  logger.info('\n🏛️  Syncing committees (jurisdiction cache: ~1 API call per state)...');
  let succeeded = 0;
  let failed = 0;
  let totalAssignments = 0;

  const useAPI = process.env.OPENSTATES_USE_API_COMMITTEES !== 'false';
  let committeesCache: CommitteesByJurisdictionCache | undefined;
  if (useAPI) {
    committeesCache = await buildCommitteesCache(reps);
    logger.info(`   Cached ${committeesCache.size} jurisdictions`);
  }

  for (const rep of reps) {
    try {
      const assignments = await fetchCommitteeAssignments(rep, {
        useAPI,
        committeesCache,
      });
      if (!dryRun) {
        await syncRepresentativeCommittees(rep, { assignments });
      }
      succeeded += 1;
      totalAssignments += assignments.length;
    } catch (error) {
      failed += 1;
      logger.error(`Failed for ${rep.name}`, { error: (error as Error).message });
    }
  }

  return {
    name: 'Committees',
    succeeded,
    failed,
    details: { totalAssignments },
  };
}

async function main() {
  const options = parseArgs();
  const reps = await loadRepresentatives(options);

  const eligible = reps.filter((rep) => rep.supabaseRepresentativeId != null);
  if (eligible.length === 0) {
    logger.info('No representatives with Supabase IDs found; nothing to sync.');
    return;
  }

  logger.info(
    `\n🚀 Starting OpenStates sync for ${eligible.length} STATE/LOCAL representatives${
      options.states?.length ? ` in ${options.states.join(', ')}` : ''
    }${options.dryRun ? ' (DRY RUN)' : ''}...\n`,
  );

  const results: SyncResult[] = [];

  // Sync operations that don't require API calls (from YAML data)
  results.push(await syncContacts(eligible, Boolean(options.dryRun)));
  results.push(await syncSocial(eligible, Boolean(options.dryRun)));
  results.push(await syncPhotos(eligible, Boolean(options.dryRun)));
  results.push(await syncDataSources(eligible, Boolean(options.dryRun)));
  results.push(await syncCommittees(eligible, Boolean(options.dryRun)));

  // Activity sync (requires OpenStates API - rate limited)
  if (!options.skipActivity) {
    logger.info('\n📜 Syncing activity (OpenStates API - may take time due to rate limits)...');
    try {
      const activityResult = await syncActivityForRepresentatives({
        states: options.states,
        limit: options.limit,
        dryRun: options.dryRun,
      } as ActivitySyncOptions);

      results.push({
        name: 'Activity',
        succeeded: activityResult.processed,
        failed: activityResult.failed + activityResult.rateLimited,
        details: {
          activityRows: activityResult.activityRows,
          rateLimited: activityResult.rateLimited,
          apiUsage: activityResult.apiUsage,
        },
      });
    } catch (error) {
      logger.error('Activity sync failed', { error: (error as Error).message });
      results.push({
        name: 'Activity',
        succeeded: 0,
        failed: eligible.length,
      });
    }
  } else {
    logger.info('\n⏭️  Skipping activity sync (--skip-activity flag set)');
  }

  // Events sync (requires OpenStates API - rate limited)
  // Note: Events sync is separate script - can be run independently
  // Skipping in sync-all to avoid complexity, but available via: npm run openstates:sync:events
  if (!options.skipEvents) {
    logger.info('\n📅 Events sync available separately: npm run openstates:sync:events');
    logger.info('   (Skipping in sync-all to avoid rate limit issues - run separately if needed)');
  }

  // Summary
  logger.info('\n' + '='.repeat(60));
  logger.info('📊 SYNC SUMMARY');
  logger.info('='.repeat(60));

  let totalSucceeded = 0;
  let totalFailed = 0;

  for (const result of results) {
    const status = result.failed === 0 ? '✅' : result.succeeded === 0 ? '❌' : '⚠️';
    logger.info(
      `${status} ${result.name}: ${result.succeeded} succeeded, ${result.failed} failed`,
    );
    if (result.details) {
      Object.entries(result.details).forEach(([key, value]) => {
        logger.info(`   ${key}: ${value}`);
      });
    }
    totalSucceeded += result.succeeded;
    totalFailed += result.failed;
  }

  logger.info('='.repeat(60));
  logger.info(`Total: ${totalSucceeded} succeeded, ${totalFailed} failed`);
  logger.info('='.repeat(60) + '\n');
}

main().catch((error) => {
  logger.error('Sync failed', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
