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


