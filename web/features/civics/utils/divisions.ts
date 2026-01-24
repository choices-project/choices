import type { Representative } from '@/types/representative';

export const normalizeDivisionIds = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((value) => (typeof value === 'string' ? value.trim() : null))
    .filter((value): value is string => Boolean(value));
};

export const getRepresentativeDivisionIds = (
  representative: Partial<Representative> | undefined | null,
): string[] => {
  if (!representative) {
    return [];
  }

  return normalizeDivisionIds(
    representative.ocdDivisionIds ??
      representative.division_ids ??
      (representative as unknown as { divisionIds?: unknown })?.divisionIds,
  );
};

export const getStateCodeFromDivisions = (divisions: string[]): string | null => {
  for (const division of divisions) {
    if (typeof division !== 'string') continue;
    const match = division.match(/state:([a-z]{2})/i);
    if (match) {
      return match[1]?.toUpperCase() ?? null;
    }
  }
  return null;
};

export const getStateCodeFromDivision = (division: string | null | undefined): string | null => {
  if (!division) return null;
  const match = division.match(/state:([a-z]{2})/i);
  return match ? match[1]?.toUpperCase() ?? null : null;
};

const COUNTRY_US = 'ocd-division/country:us';

/**
 * Filter division IDs for election lookups. Drops `ocd-division/country:us` when
 * more specific divisions exist (state, district, etc.) so we avoid returning
 * the same broad elections for every rep. Use when calling get_upcoming_elections.
 */
export const filterDivisionsForElections = (divisionIds: string[]): string[] => {
  const normalized = divisionIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
  if (normalized.length <= 1) return normalized;
  const hasCountryUs = normalized.some((id) => id.trim().toLowerCase() === COUNTRY_US);
  const hasMoreSpecific = normalized.some((id) => {
    const t = id.trim().toLowerCase();
    return t !== COUNTRY_US && (t.includes('/state:') || t.includes('/district:') || t.includes('/place:'));
  });
  if (hasCountryUs && hasMoreSpecific) {
    return normalized.filter((id) => id.trim().toLowerCase() !== COUNTRY_US);
  }
  return normalized;
};



