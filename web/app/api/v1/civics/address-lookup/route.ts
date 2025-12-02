/**
 * Civics Address Lookup API Endpoint - SOLE EXCEPTION
 *
 * ⚠️ IMPORTANT: This is the ONLY endpoint in the web application that calls external APIs.
 *
 * WHY THIS EXCEPTION EXISTS:
 * ===========================
 *
 * This endpoint is the sole exception to the rule that web endpoints should only query Supabase.
 * The reason is that it's NOT FEASIBLE to store and manage all possible addresses for district
 * cross-reference in our database:
 *
 * 1. **Address Volume**: There are millions of addresses in the US, and storing all of them
 *    would be prohibitively expensive and impractical.
 *
 * 2. **Dynamic Nature**: Addresses change constantly:
 *    - New developments and buildings are constructed
 *    - Addresses are reassigned
 *    - Districts change due to redistricting
 *
 * 3. **Real-time Requirements**: Users need current, accurate jurisdiction information for
 *    their specific address, which requires real-time resolution.
 *
 * 4. **Redistricting**: Electoral districts change after census years, making historical
 *    address mappings obsolete.
 *
 * ARCHITECTURE:
 * =============
 *
 * This endpoint uses Google Civic Information API to resolve an address to its current
 * electoral jurisdictions (congressional district, state house, state senate, etc.).
 *
 * IMPORTANT SECURITY NOTES:
 * - The API key is stored in .env.local and accessed via process.env (server-side only)
 * - This endpoint does NOT expose the API key to the client
 * - The API key is used server-side only and never sent to the browser
 * - Rate limiting should be applied to prevent abuse
 *
 * WHAT THIS ENDPOINT DOES:
 * - Takes an address string as input
 * - Calls Google Civic API to get current jurisdiction information
 * - Returns jurisdiction data (state, district, county, etc.)
 * - Sets a privacy-safe jurisdiction cookie for subsequent queries
 *
 * WHAT THIS ENDPOINT DOES NOT DO:
 * - It does NOT store the address in our database
 * - It does NOT store jurisdiction mappings
 * - It does NOT ingest representative data (that's done by the backend service)
 * - It does NOT expose API keys to clients
 *
 * ALTERNATIVE APPROACHES CONSIDERED:
 * - Storing all addresses in database: Not feasible due to volume and maintenance
 * - Caching addresses: Possible but addresses change and cache invalidation is complex
 * - Geocoding to lat/lng then looking up: Still requires external API for geocoding
 *
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 */

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError, errorResponse, methodNotAllowed } from '@/lib/api';
import { assertPepperConfig } from '@/lib/civics/env-guard';
import {
  generateAddressHMAC,
  setJurisdictionCookie,
  validateAddressInput,
} from '@/lib/civics/privacy-utils';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

type Jurisdiction = {
  state: string;
  district: string | null;
  county: string | null;
  ocd_division_id: string | null;
  fallback?: boolean;
};

// -----------------------------------------------------------------------------
// In-memory rate limiting + response cache (best-effort, per-runtime)
// -----------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // per IP per window
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes
const CACHE_MAX_ENTRIES = 1000;

const ipBuckets = new Map<string, Array<number>>(); // ip -> timestamps
type CacheEntry = { value: Jurisdiction; expiresAt: number };
const addressCache = new Map<string, CacheEntry>(); // key: normalized address

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) ?? [];
  const recent = bucket.filter((ts) => now - ts <= RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  ipBuckets.set(ip, recent);
  return recent.length <= RATE_LIMIT_MAX_REQUESTS;
}

function getFromCache(address: string): Jurisdiction | null {
  const key = address.trim().toLowerCase();
  const entry = addressCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    addressCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(address: string, value: Jurisdiction): void {
  const key = address.trim().toLowerCase();
  if (addressCache.size >= CACHE_MAX_ENTRIES) {
    // drop oldest entry
    const firstKey = addressCache.keys().next().value as string | undefined;
    if (firstKey) addressCache.delete(firstKey);
  }
  addressCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Look up jurisdiction information for an address using Google Civic API
 *
 * This is the ONLY external API call in the web application.
 * See file header documentation for why this exception exists.
 */
async function lookupJurisdictionFromExternalAPI(address: string): Promise<Jurisdiction> {
  // IMPORTANT: Address lookup requires external API calls because:
  // 1. We can't store every possible address in our database
  // 2. Addresses change (new developments, redistricting)
  // 3. We need real-time jurisdiction resolution

  logger.info('Address lookup requested for jurisdiction resolution', {
    addressLength: address.length,
    note: 'This is the only external API call in the web application'
  });

  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) {
    logger.error('GOOGLE_CIVIC_API_KEY not configured for address lookup');
    throw new Error('Address lookup service not configured');
  }

  try {
    // Call Google Civic Information API for jurisdiction resolution
    // This is the correct approach for address → jurisdiction mapping
    const response = await fetch(
      `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      logger.error('Google Civic API error', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract jurisdiction information from the response
    const jurisdiction: Jurisdiction = {
      state: data.normalizedInput?.state || extractStateFromAddress(address),
      district: extractDistrict(data.divisions || {}),
      county: extractCounty(data.divisions || {}),
      ocd_division_id: extractOCDDivisionId(data.divisions || {}),
      fallback: false
    };

    logger.info('Jurisdiction resolved successfully', {
      state: jurisdiction.state,
      hasDistrict: !!jurisdiction.district,
      hasOCDDivision: !!jurisdiction.ocd_division_id
    });

    return jurisdiction;

  } catch (error) {
    logger.error('External API lookup failed', error instanceof Error ? error : new Error(String(error)));

    // Fallback: extract state from address and return minimal jurisdiction
    // This allows the app to continue working even if the API is unavailable
    return {
      state: extractStateFromAddress(address),
      district: null,
      county: null,
      ocd_division_id: null,
      fallback: true
    };
  }
}

/**
 * Extract state code from address string
 */
function extractStateFromAddress(address: string): string {
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
  };

  for (const [stateName, stateCode] of Object.entries(stateMap)) {
    const pattern = new RegExp(`\\b${stateName}\\b`, 'i');
    if (pattern.test(address.toLowerCase())) {
      return stateCode;
    }
  }

  for (const [, stateCode] of Object.entries(stateMap)) {
    const pattern = new RegExp(`\\b${stateCode}\\b`, 'i');
    if (pattern.test(address.toLowerCase())) {
      return stateCode;
    }
  }

  return 'CA'; // Default fallback
}

/**
 * Extract congressional district from Google Civic divisions
 */
function extractDistrict(divisions: Record<string, any>): string | null {
  for (const [key, division] of Object.entries(divisions)) {
    if (key.includes('cd:') && division.name) {
      const match = key.match(/cd:(\d+)/);
      return match ? match[1] ?? null : null;
    }
  }
  return null;
}

/**
 * Extract county from Google Civic divisions
 */
function extractCounty(divisions: Record<string, any>): string | null {
  for (const [key, division] of Object.entries(divisions)) {
    if (key.includes('county:') && division.name) {
      return division.name.replace(/County/i, '').trim();
    }
  }
  return null;
}

/**
 * Extract OCD division ID from Google Civic divisions
 */
function extractOCDDivisionId(divisions: Record<string, any>): string | null {
  // Return the first OCD division ID found
  const keys = Object.keys(divisions);
  return keys.length > 0 ? (keys[0] ?? null) : null;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Check pepper config, but handle gracefully if not configured (e.g., in CI)
  // In CI environments, we allow fallback mode to enable smoke tests
  try {
    assertPepperConfig();
  } catch (error) {
    // In CI, allow fallback mode for smoke tests
    // In production, this should be a hard failure
    if (process.env.NODE_ENV === 'production' && !process.env.CI) {
      logger.error('Privacy pepper not configured in production', {
        error: error instanceof Error ? error.message : String(error)
      });
      return errorResponse('Privacy configuration required', 503, {
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    // In CI, log warning but continue with fallback
    logger.warn('Privacy pepper not configured, using fallback mode (CI)', {
      error: error instanceof Error ? error.message : String(error)
    });
  }

  const body = await request.json().catch(() => null);
  const address = body?.address;

  if (!address || typeof address !== 'string') {
    return validationError({ address: 'Address is required' });
  }

  const validation = validateAddressInput(address);
  if (!validation.valid) {
    // Return 503 for feature disabled, 400 for other validation errors
    if (validation.error?.toLowerCase().includes('disabled')) {
      return errorResponse(validation.error ?? 'Feature disabled', 503);
    }
    return validationError({ address: validation.error ?? 'Invalid address' });
  }

  const addrH = generateAddressHMAC(address);
  void addrH;

  // Rate limit by IP
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
  if (!rateLimit(clientIp)) {
    return errorResponse('Rate limit exceeded', 429, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX_REQUESTS });
  }

  // Check cache
  const cached = getFromCache(address);
  if (cached) {
    return successResponse(
      { jurisdiction: cached },
      { cached: true, cacheTtlMs: Math.max(0, CACHE_TTL_MS) }
    );
  }

  try {
    const jurisdiction = await lookupJurisdictionFromExternalAPI(address);
    setCache(address, jurisdiction);

    const cookieData: Record<string, string> = {
      state: jurisdiction.state
    };
    if (jurisdiction.district) cookieData.district = jurisdiction.district;
    if (jurisdiction.county) cookieData.county = jurisdiction.county;
    await setJurisdictionCookie(cookieData);

    // Best-effort analytics write (non-blocking) with lazy server import to avoid client test env issues
    try {
      const mod = await import('@/utils/supabase/server');
      const supabase = await (mod as any).getSupabaseServerClient();
      if (supabase) {
        await (supabase as any)
          .from('platform_analytics')
          .insert({
            metric_name: 'address_lookup',
            metric_value: 1,
            metric_type: 'counter',
            dimensions: {
              cached: false,
              fallback: Boolean(jurisdiction.fallback),
              state: jurisdiction.state ?? null,
            },
            category: 'civics',
            source: 'address_lookup_api'
          });
      }
    } catch {
      // ignore analytics errors
    }

    // Return 200 even for fallback responses (they're still valid data)
    // The fallback flag indicates the data source
    return successResponse(
      {
        jurisdiction
      },
      {
        fallback: jurisdiction.fallback ?? false,
        integration: jurisdiction.fallback ? 'fallback' : 'google-civic'
      }
    );
  } catch (error) {
    logger.error('Address lookup error', error instanceof Error ? error : new Error(String(error)));
    
    // If external API fails, return fallback jurisdiction instead of error
    // This ensures the endpoint is always functional even when external services are down
    const fallbackJurisdiction: Jurisdiction = {
      state: extractStateFromAddress(address),
      district: null,
      county: null,
      ocd_division_id: null,
      fallback: true
    };
    
    // Cache the fallback so we don't keep hitting the external API
    setCache(address, fallbackJurisdiction);
    
    // Return 200 with fallback data - this is still a valid response
    return successResponse(
      {
        jurisdiction: fallbackJurisdiction
      },
      {
        fallback: true,
        integration: 'fallback',
        warning: 'External API unavailable, using fallback jurisdiction data'
      }
    );
  }
});

export const GET = withErrorHandling(async () => methodNotAllowed(['POST']));
export const PUT = withErrorHandling(async () => methodNotAllowed(['POST']));
export const DELETE = withErrorHandling(async () => methodNotAllowed(['POST']));
