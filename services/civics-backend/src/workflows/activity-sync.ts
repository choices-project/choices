import { fetchRecentBillsForPerson } from '../clients/openstates.js';
import { deriveJurisdictionFilter } from '../enrich/state.js';
import { collectActiveRepresentatives, type CollectOptions } from '../ingest/openstates/index.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import { fetchFederalRepresentatives, type FetchFederalOptions } from '../ingest/supabase/representatives.js';
import { syncRepresentativeActivity } from '../persist/activity.js';

export interface ActivitySyncOptions {
  states?: string[];
  limit?: number;
  dryRun?: boolean;
  includeFederalOnly?: boolean;
  logger?: Pick<typeof console, 'log' | 'warn' | 'error'>;
}

interface ActivitySyncResult {
  total: number;
  processed: number;
  failed: number;
  activityRows: number;
  dryRun: boolean;
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
  const reps: CanonicalRepresentative[] = [];

  const federalOptions: FetchFederalOptions = {};
  if (options.states && options.states.length > 0) {
    federalOptions.states = options.states;
  }

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

  const deduped = dedupeRepresentatives(reps);
  if (typeof options.limit === 'number') {
    return deduped.slice(0, options.limit);
  }
  return deduped;
}

export async function syncActivityForRepresentatives(
  options: ActivitySyncOptions = {},
): Promise<ActivitySyncResult> {
  const logger = options.logger ?? console;
  const reps = await loadRepresentatives(options);
  const eligible = reps.filter((rep) => rep.supabaseRepresentativeId != null);

  if (eligible.length === 0) {
    logger.log('No representatives with Supabase IDs found; nothing to sync.');
    return {
      total: 0,
      processed: 0,
      failed: 0,
      activityRows: 0,
      dryRun: Boolean(options.dryRun),
    };
  }

  const limit = DEFAULT_ACTIVITY_LIMIT;
  const dryRun = Boolean(options.dryRun);

  let processed = 0;
  let failed = 0;
  let activityRows = 0;

  for (const rep of eligible) {
    try {
      const jurisdiction = deriveJurisdictionFilter(rep);
      const fetchOptions: { limit: number; jurisdiction?: string; query?: string } = { limit };
      if (jurisdiction) fetchOptions.jurisdiction = jurisdiction;
      if (!jurisdiction) fetchOptions.query = rep.name || rep.openstatesId || undefined;
      const bills = await fetchRecentBillsForPerson(rep.openstatesId || '', fetchOptions);
      if (!dryRun) {
        await syncRepresentativeActivity(rep, { bills });
      }
      activityRows += bills.length;
      processed += 1;
    } catch (error) {
      failed += 1;
      logger.error(
        `Failed to sync activity for ${rep.name} (${rep.supabaseRepresentativeId ?? 'unknown id'}):`,
        (error as Error).message,
      );
    }
  }

  return {
    total: eligible.length,
    processed,
    failed,
    activityRows,
    dryRun,
  };
}


