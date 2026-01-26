/**
 * Parse office city and ZIP from a US-style address string.
 * Used for representative_contacts address values (e.g. civic center / capitol).
 *
 * Expects trailing ", City, ST 12345" or ", City, ST 12345-6789".
 * Returns zip5 (5 digits) when present.
 */

const TRAILING_CITY_ST_ZIP = /,\s*([^,]+),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/;

export function parseOfficeCityZip(address: string): { city: string; zip: string } | null {
  if (!address || typeof address !== 'string') return null;
  const trimmed = address.trim();
  if (trimmed.length < 10) return null;

  const match = trimmed.match(TRAILING_CITY_ST_ZIP);
  if (!match) return null;

  const [, city, , zipFull] = match;
  const cityNorm = city?.trim();
  const zip5 = zipFull ? zipFull.replace(/\D/g, '').slice(0, 5) : '';

  if (!cityNorm || zip5.length !== 5) return null;
  return { city: cityNorm, zip: zip5 };
}
