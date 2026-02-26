/**
 * High-level helpers for working with the OpenStates YAML canonical data inside the ingest
 * pipeline. These helpers stitch together the file-system sourced canonical records with
 * existing Supabase rows and crosswalk entries so other flows can operate without worrying
 * about the raw YAML layout.
 *
 * CRITICAL: OpenStates (YAML + API) contains ONLY state and local representatives.
 * There is never any federal representative data from OpenStates.
 *
 * ⚠️  This module is **separate** from the OpenStates HTTP client. If you need live API
 *      data (bills, votes, committees) see `src/clients/openstates.ts`.
 */

import { readOpenStatesPeople } from './people.js';
import {
  fetchRepresentativeCoreByOpenStates,
  applyRepresentativeCore,
  type SupabaseRepresentativeRow,
} from '../supabase/representatives.js';
import {
  fetchCrosswalkEntries,
  applyCrosswalkToRepresentative,
  type CrosswalkRow,
} from '../supabase/crosswalk.js';

export interface CollectOptions {
  states?: string[];
  limit?: number;
}

/**
 * Read the OpenStates YAML archive and merge the resulting canonical people with any
 * persisted Supabase data (contacts, identifiers, crosswalk entries). The result is a list
 * of `CanonicalRepresentative` objects that include the latest YAML metadata plus any
 * persisted enrichments.
 *
 * Useful when building state-level pipelines that should operate entirely offline until
 * the moment we persist the final output, or when we want to seed additional enrichers
 * (like the OpenStates API, GovTrack, etc.) with the canonical baseline.
 *
 * @param options.states Optional collection of two-letter state codes to filter on (case-insensitive)
 * @param options.limit Optional maximum number of representatives to return
 */
export async function collectActiveRepresentatives(
  options: CollectOptions = {},
) {
  const { limit } = options;
  const reps = [];
  for await (const rep of readOpenStatesPeople({
    ...options,
    includeInactive: false,
    includeRetired: false,
  })) {
    reps.push(rep);
    if (typeof limit === 'number' && reps.length >= limit) {
      break;
    }
  }
  if (reps.length === 0) {
    return reps;
  }

  const openstatesIds = reps.map((rep) => rep.openstatesId).filter(Boolean);
  let coreMap = new Map<string, SupabaseRepresentativeRow>();
  let crosswalkMap = new Map<string, CrosswalkRow[]>();

  try {
    coreMap = await fetchRepresentativeCoreByOpenStates(openstatesIds);
  } catch (error) {
    console.warn('Unable to fetch representatives_core rows:', (error as Error).message);
  }

  try {
    crosswalkMap = await fetchCrosswalkEntries(reps.map((rep) => rep.canonicalKey));
  } catch (error) {
    console.warn('Unable to fetch id_crosswalk entries:', (error as Error).message);
  }

  return reps.map((rep) => {
    const withCore = applyRepresentativeCore(rep, coreMap.get(rep.openstatesId));
    return applyCrosswalkToRepresentative(withCore, crosswalkMap.get(withCore.canonicalKey));
  });
}

