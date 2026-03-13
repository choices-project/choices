/**
 * Format representative location as "City, ST • District X" for consistent card display.
 * Handles at-large (district "0" or "at-large"), statewide offices (senators),
 * and missing data with meaningful fallbacks.
 */

export type FormatRepresentativeLocationInput = {
  state: string;
  office_city?: string | null;
  district?: string | null;
  office?: string | null;
};

export function formatRepresentativeLocation(input: FormatRepresentativeLocationInput): string {
  const { state, office_city, district, office } = input;
  const city = office_city?.trim() || null;
  const st = state?.trim() || '';

  const locationParts: string[] = [];
  if (city) locationParts.push(city);
  if (st) locationParts.push(st);
  const location = locationParts.length > 0 ? locationParts.join(', ') : state || '';

  const isSenator = office?.toLowerCase().includes('senator') ?? false;
  const isGovernor = office?.toLowerCase().includes('governor') ?? false;

  let districtPart: string;
  if (isSenator || isGovernor) {
    districtPart = 'Statewide';
  } else if (district != null && String(district).trim() !== '') {
    const d = String(district).trim().toLowerCase();
    if (d === 'at-large' || d === '0') {
      districtPart = 'At-large';
    } else {
      districtPart = `District ${district.trim()}`;
    }
  } else {
    districtPart = '';
  }

  if (districtPart) {
    return `${location} • ${districtPart}`;
  }
  return location;
}
