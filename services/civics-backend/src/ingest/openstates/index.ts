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

