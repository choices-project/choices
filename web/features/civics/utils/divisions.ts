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



