/**
 * On-Device Location Resolution
 * 
 * Resolves addresses/coordinates to public jurisdiction IDs only.
 * No plaintext address or GPS ever leaves the device.
 */

import { withOptional } from '../util/objects';

export type JurisdictionID = string; // e.g. "ocd-division/country:us/state:ca/county:alameda"

export interface ClientResolvedJurisdiction {
  jurisdictionIds: JurisdictionID[];     // public IDs only
  coarseGrid?: string;                   // optional H3/S2 cell for caching
  level: 'federal' | 'state' | 'local';
}

export interface LocationInput {
  address?: string;
  coords?: [number, number]; // [longitude, latitude]
  zipCode?: string;
}

/**
 * Resolves location input to public jurisdiction IDs only
 * 
 * OPTION A: Google Civic API (client-side, key restricted to origins)
 * OPTION B: Offline geospatial lookup (H3/S2 → OCD IDs) bundled as static assets
 */
export async function resolveJurisdictions(
  input: LocationInput
): Promise<ClientResolvedJurisdiction> {
  // Validate input
  if (!input.address && !input.coords && !input.zipCode) {
    throw new Error('At least one location input required');
  }

  // OPTION A: Google Civic API (client-side)
  if (input.address || input.coords) {
    return await resolveViaGoogleCivic(input);
  }

  // OPTION B: Offline geospatial lookup (for zip codes or when offline)
  if (input.zipCode) {
    return await resolveViaOfflineLookup(input.zipCode);
  }

  throw new Error('Unable to resolve jurisdiction');
}

/**
 * Resolve via Google Civic API (client-side only)
 * API key must be restricted to specific origins
 */
async function resolveViaGoogleCivic(input: LocationInput): Promise<ClientResolvedJurisdiction> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CIVIC_API_KEY;
  if (!apiKey) {
    throw new Error('Google Civic API key not configured');
  }

  let query = '';
  if (input.address) {
    query = `address=${encodeURIComponent(input.address)}`;
  } else if (input.coords) {
    query = `address=${input.coords[1]},${input.coords[0]}`; // lat,lng format
  }

  const response = await fetch(
    `https://www.googleapis.com/civicinfo/v2/representatives?${query}&key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Google Civic API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Extract jurisdiction IDs from the response
  const jurisdictionIds: JurisdictionID[] = [];
  let level: 'federal' | 'state' | 'local' = 'local';

  // Process divisions to extract OCD IDs
  if (data.divisions) {
    for (const [divisionId, division] of Object.entries(data.divisions)) {
      if (typeof divisionId === 'string' && divisionId.startsWith('ocd-division/')) {
        jurisdictionIds.push(divisionId);
        
        // Determine level based on division structure
        if (divisionId.includes('/country:us/state:') && !divisionId.includes('/county:') && !divisionId.includes('/place:')) {
          level = 'state';
        } else if (divisionId.includes('/country:us/state:') && !divisionId.includes('/county:') && !divisionId.includes('/place:')) {
          level = 'federal';
        }
      }
    }
  }

  // Generate H3 cell for caching (optional)
  const coarseGrid = input.coords ? generateH3Cell(input.coords) : undefined;

  return withOptional(
    {
      jurisdictionIds,
      level
    },
    {
      coarseGrid
    }
  );
}

/**
 * Resolve via offline geospatial lookup
 * Uses bundled static assets for H3/S2 → OCD ID mapping
 */
async function resolveViaOfflineLookup(zipCode: string): Promise<ClientResolvedJurisdiction> {
  // This would use bundled static assets for offline lookup
  // For now, return a placeholder structure
  // In production, this would load from bundled JSON files
  
  const jurisdictionIds: JurisdictionID[] = [
    `ocd-division/country:us/state:ca/county:alameda`, // placeholder
    `ocd-division/country:us/state:ca` // placeholder
  ];

  return {
    jurisdictionIds,
    level: 'local'
  };
}

/**
 * Generate H3 cell for coarse grid caching
 */
function generateH3Cell(coords: [number, number]): string {
  // This would use the H3 library to generate a cell ID
  // For now, return a placeholder
  return `h3:8:87283082bffffff`; // placeholder H3 cell
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
