/**
 * On-Device Location Resolution
 * 
 * Resolves addresses/coordinates to public jurisdiction IDs only.
 * No plaintext address or GPS ever leaves the device.
 */

export type JurisdictionID = string; // e.g. "ocd-division/country:us/state:ca/county:alameda"

export type ClientResolvedJurisdiction = {
  jurisdictionIds: JurisdictionID[];
  primaryOcdId?: JurisdictionID | null;
  jurisdictionName?: string | null;
  lat?: number | null;
  lon?: number | null;
  accuracy?: number | null;
  precision: GeoPrecision;
  provider: string;
  aliasConfidence?: number | null;
  storedAt?: string;
};

export type GeoPrecision = 'exact' | 'approximate' | 'zip' | 'city' | 'state' | 'unknown';

export type LocationInput = {
  address?: string;
  coords?: { lat: number; lon: number; accuracy?: number | null };
  zipCode?: string;
};

const ENDPOINT = '/api/v1/civics/address-lookup';

export async function resolveJurisdictions(input: LocationInput): Promise<ClientResolvedJurisdiction> {
  if (!input.address && !input.coords && !input.zipCode) {
    throw new Error('Provide address, coordinates, or ZIP code');
  }

  const payload: Record<string, unknown> = {};
  if (input.address) payload.address = input.address;
  if (input.zipCode) payload.zip = input.zipCode;
  if (input.coords) {
    payload.coords = {
      lat: input.coords.lat,
      lon: input.coords.lon,
      accuracy: input.coords.accuracy ?? null,
    };
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || 'Unable to resolve location';
    throw new Error(message);
  }

  const location = data?.location ?? {};

  return {
    jurisdictionIds: location.jurisdictionIds ?? [],
    primaryOcdId: location.primaryOcdId ?? null,
    jurisdictionName: location.jurisdictionName ?? null,
    lat: location.lat ?? null,
    lon: location.lon ?? null,
    accuracy: location.accuracy ?? null,
    precision: location.precision ?? 'unknown',
    provider: location.provider ?? 'unknown',
    aliasConfidence: location.aliasConfidence ?? null,
    storedAt: location.storedAt ?? null,
  };
}

/**
 * Validate jurisdiction ID format
 */
export function isValidJurisdictionId(id: string): boolean {
  // Allowlist regex for OCD format
  const ocdPattern = /^ocd-division\/country:us(\/state:[a-z]{2})?(\/county:[a-z0-9_-]+)?(\/place:[a-z0-9_-]+)?$/;
  return ocdPattern.test(id);
}

/**
 * Extract state from jurisdiction ID
 */
export function extractStateFromJurisdictionId(id: string): string | null {
  const match = id.match(/\/state:([a-z]{2})/);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  return null;
}

/**
 * Extract county from jurisdiction ID
 */
export function extractCountyFromJurisdictionId(id: string): string | null {
  const match = id.match(/\/county:([a-z0-9_-]+)/);
  return match ? match[1] ?? null : null;
}
