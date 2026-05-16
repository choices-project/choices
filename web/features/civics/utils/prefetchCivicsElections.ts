import { filterDivisionsForElections } from '@/features/civics/utils/divisions';

import { useElectionStore } from '@/lib/stores/electionStore';

type RepresentativeWithDivisions = {
  metadata?: { division_ids?: string[] };
};

/**
 * One elections API call for a civics rep list, then per-card cache keys.
 * Call before rendering RepresentativeCard rows to avoid N parallel fetches.
 */
export async function prefetchElectionsForRepresentatives(
  representatives: RepresentativeWithDivisions[],
): Promise<void> {
  const divisionGroups: string[][] = [];
  const allDivisions = new Set<string>();

  for (const representative of representatives) {
    const ids = filterDivisionsForElections(representative.metadata?.division_ids ?? []);
    if (ids.length === 0) {
      continue;
    }
    divisionGroups.push(ids);
    ids.forEach((id) => allDivisions.add(id));
  }

  if (allDivisions.size === 0) {
    return;
  }

  const { fetchElectionsForDivisions, indexElectionsForDivisionGroups } =
    useElectionStore.getState();
  const elections = await fetchElectionsForDivisions([...allDivisions]);
  indexElectionsForDivisionGroups(divisionGroups, elections);
}
