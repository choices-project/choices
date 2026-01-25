import {
  collectActiveRepresentatives,
  type CollectOptions,
} from '../ingest/openstates/index.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import { fetchFederalRepresentatives, type FetchFederalOptions } from '../ingest/supabase/representatives.js';
import {
  buildUnifiedRepresentative,
  type UnifiedRepresentative,
} from './build-representative.js';

export async function buildFederalPipelineBatch(
  options: CollectOptions = {},
): Promise<UnifiedRepresentative[]> {
  const fetchOptions: FetchFederalOptions = {};
  if (typeof options.limit === 'number') {
    fetchOptions.limit = options.limit;
  }
  if (options.states && options.states.length > 0) {
    fetchOptions.states = options.states;
  }

  const canonical = await fetchFederalRepresentatives(fetchOptions);
  const federalReps = canonical.filter(hasFederalRole);
  const limited = applyLimit(federalReps, options.limit);

  return Promise.all(limited.map((rep) => buildUnifiedRepresentative(rep)));
}

export async function buildStatePipelineBatch(
  options: CollectOptions = {},
): Promise<UnifiedRepresentative[]> {
  const canonical = await collectActiveRepresentatives(options);
  const stateReps = canonical.filter(hasStateRole);
  const limited = applyLimit(stateReps, options.limit);

  return Promise.all(limited.map((rep) => buildUnifiedRepresentative(rep)));
}

function applyLimit<T>(input: T[], limit: number | undefined): T[] {
  if (typeof limit === 'number') {
    return input.slice(0, limit);
  }
  return input;
}

function hasFederalRole(rep: CanonicalRepresentative): boolean {
  return Boolean(rep.identifiers.bioguide || rep.identifiers.fec);
}

function hasStateRole(rep: CanonicalRepresentative): boolean {
  return !hasFederalRole(rep);
}

export { buildUnifiedRepresentative } from './build-representative.js';
export type { UnifiedRepresentative } from './build-representative.js';

