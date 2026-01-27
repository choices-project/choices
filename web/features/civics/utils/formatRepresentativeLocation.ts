/**
 * Format representative location as "City, ST • District X" for consistent card display.
 * Uses fallbacks when city or district is missing so all cards share the same structure.
 *
 * When "—" appears: city comes from representative_contacts primary address (parseOfficeCityZip);
 * district from representatives_core.district. Upstream ingest/API improvements (e.g. explicit
 * office city, "at-large" for at-large reps) can reduce fallback usage.
 */

const FALLBACK_CITY = '—';
const FALLBACK_DISTRICT = '—';

export type FormatRepresentativeLocationInput = {
  state: string;
  office_city?: string | null;
  district?: string | null;
};

/**
 * Produces "City, ST • District X". Handles at-large, numeric districts, and missing data.
 */
export function formatRepresentativeLocation(input: FormatRepresentativeLocationInput): string {
  const { state, office_city, district } = input;
  const city = office_city?.trim() || FALLBACK_CITY;
  const st = state?.trim() || '—';
  const location = `${city}, ${st}`;

  let districtPart: string;
  if (district != null && String(district).trim() !== '') {
    const d = String(district).trim().toLowerCase();
    districtPart = d === 'at-large' ? 'At-large' : `District ${district.trim()}`;
  } else {
    districtPart = FALLBACK_DISTRICT;
  }

  return `${location} • ${districtPart}`;
}
