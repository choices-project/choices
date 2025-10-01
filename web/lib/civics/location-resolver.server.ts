import { logWarn } from '@/lib/logger';
import { generateAddressHMAC, geohashWithJitter } from '@/lib/civics/privacy-utils';
import { ConsentManager } from '@/utils/privacy/consent';
import type {
  DatabaseTypes,
  UserLocationResolution,
  CivicJurisdiction,
  JurisdictionAlias,
  JurisdictionTile,
} from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type Database = DatabaseTypes;

// Map provider types to database source types
function _mapProviderToSource(provider: 'census' | 'nominatim' | 'google' | 'browser' | 'manual' | 'fallback'): 'browser' | 'manual' | 'import' | 'support' {
  switch (provider) {
    case 'browser':
    case 'manual':
      return provider;
    case 'census':
    case 'nominatim':
    case 'google':
      return 'import';
    case 'fallback':
    default:
      return 'support';
  }
}

export type ResolverInput = {
  address?: string | undefined;
  zip?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  accuracy?: number | null;
  requestId: string;
};

type CoordinateResolution = {
  lat: number;
  lon: number;
  accuracy: number | null;
  precision: GeoPrecision;
  provider: 'browser' | 'manual' | 'import' | 'support' | 'fallback';
  normalizedAddress?: string | undefined;
  zip?: string | null;
};

export type ResolverOutcome = {
  lat: number;
  lon: number;
  accuracy?: number | null;
  precision: GeoPrecision;
  provider: 'browser' | 'manual' | 'import' | 'support';
  normalizedAddress?: string;
  zip?: string | null;
  jurisdictionIds: string[];
  primaryOcdId?: string | null;
  jurisdictionName?: string | null;
  aliasConfidence?: number | null;
  coarseHash?: string | null;
  storedResolution: UserLocationResolution;
};

export type GeoPrecision = 'exact' | 'approximate' | 'zip' | 'city' | 'state' | 'unknown';

type Supabase = SupabaseClient<Database>;

const USER_AGENT = 'Choices-Civics-Platform/1.0 (+https://github.com/choices/choices)';

export async function resolveAndPersistLocation(options: {
  supabase: Supabase;
  userId: string;
  input: ResolverInput;
}): Promise<ResolverOutcome> {
  const { supabase, userId, input } = options;

  if (!input.address && (input.latitude === undefined || input.longitude === undefined) && !input.zip) {
    throw new Error('address, coordinates, or zip required');
  }

  const consentManager = new ConsentManager(supabase);
  const hasDemographics = await consentManager.hasConsent('demographics');
  if (!hasDemographics) {
    throw new Error('User has not granted demographics consent');
  }

  const consentVersion = await getLatestConsentVersion(supabase, userId);

  const providerChain: string[] = [];
  const zipFromInput = sanitizeZip(input.zip ?? extractZipFromAddress(input.address));

  let coordinateResult = await resolveCoordinates(input, providerChain);

  if (!coordinateResult && zipFromInput) {
    const aliasMatch = await lookupAliasByZip(supabase, zipFromInput);
    if (aliasMatch) {
      coordinateResult = {
        lat: Number.NaN,
        lon: Number.NaN,
        accuracy: null,
        precision: 'zip',
        provider: 'fallback',
        normalizedAddress: undefined,
        zip: zipFromInput,
      };
      providerChain.push('zip-alias');
    }
  }

  if (!coordinateResult) {
    throw new Error('Unable to resolve coordinates from provided input');
  }

  const coordinatePair = ensureCoordinates(coordinateResult, input);
  const lat = coordinatePair && Number.isFinite(coordinatePair.lat) ? coordinatePair.lat : null;
  const lon = coordinatePair && Number.isFinite(coordinatePair.lon) ? coordinatePair.lon : null;
  const precision = normalizePrecision(coordinateResult.precision, coordinateResult.accuracy, input.accuracy);
  const coarseHash = typeof lat === 'number' && typeof lon === 'number'
    ? createCoarseHash(lat, lon, input.requestId)
    : null;

  const jurisdictionMapping = await mapToJurisdictions({
    supabase,
    zip: zipFromInput,
    lat,
    lon,
    providerChain,
    ...(input.address && { address: input.address }),
  });

  const { resolution, action } = await upsertUserResolution({
    supabase,
    userId,
    consentVersion,
    lat,
    lon,
    accuracy: coordinateResult.accuracy ?? input.accuracy ?? null,
    precision,
    source: coordinateResult.provider as 'browser' | 'manual' | 'import' | 'support',
    coarseHash,
    zip: zipFromInput,
    primaryOcd: jurisdictionMapping.primaryOcdId ?? null,
    ...(input.address && { address: input.address }),
  });

  await recordConsentAudit({
    supabase,
    userId,
    resolutionId: resolution.id,
    action,
    providerChain,
    precision,
    primaryOcd: jurisdictionMapping.primaryOcdId ?? null,
  });

  await updateUserProfileGeo({
    supabase,
    userId,
    lat,
    lon,
    precision,
    source: coordinateResult.provider as 'browser' | 'manual' | 'import' | 'support',
    consentVersion,
    coarseHash,
  });

  return {
    lat: resolution.lat_q11 ?? lat ?? 0,
    lon: resolution.lon_q11 ?? lon ?? 0,
    accuracy: resolution.accuracy_m ?? null,
    precision,
    provider: coordinateResult.provider as 'browser' | 'manual' | 'import' | 'support',
    ...(coordinateResult.normalizedAddress && { normalizedAddress: coordinateResult.normalizedAddress }),
    zip: zipFromInput ?? coordinateResult.zip ?? null,
    jurisdictionIds: jurisdictionMapping.jurisdictionIds,
    primaryOcdId: jurisdictionMapping.primaryOcdId ?? null,
    jurisdictionName: jurisdictionMapping.jurisdictionName ?? null,
    aliasConfidence: jurisdictionMapping.aliasConfidence ?? null,
    coarseHash,
    storedResolution: resolution,
  };
}

async function resolveCoordinates(input: ResolverInput, providerChain: string[]): Promise<CoordinateResolution | null> {
  if (typeof input.latitude === 'number' && typeof input.longitude === 'number') {
    providerChain.push('browser-coordinates');
    return {
      lat: input.latitude,
      lon: input.longitude,
      accuracy: input.accuracy ?? null,
      precision: input.accuracy && input.accuracy <= 50 ? 'exact' : 'approximate',
      provider: 'browser' as const,
      normalizedAddress: input.address,
      zip: input.zip ?? null,
    };
  }

  if (input.address) {
    const census = await resolveViaCensus(input.address);
    if (census) {
      providerChain.push('census');
      return census;
    }

    const nominatim = await resolveViaNominatim(input.address);
    if (nominatim) {
      providerChain.push('nominatim');
      return nominatim;
    }

    const google = await resolveViaGoogleGeocode(input.address);
    if (google) {
      providerChain.push('google-geocode');
      return google;
    }
  }

  return null;
}

async function resolveViaCensus(address: string): Promise<CoordinateResolution | null> {
  try {
    const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress');
    url.searchParams.set('address', address);
    url.searchParams.set('benchmark', 'Public_AR_Current');
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      logWarn('Census geocoder failed', response.status, address.slice(0, 32));
      return null;
    }

    const data = await response.json();
    const match = data?.result?.addressMatches?.[0];
    if (!match?.coordinates) {
      return null;
    }

    const lat = parseFloat(match.coordinates.y);
    const lon = parseFloat(match.coordinates.x);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return null;
    }

    const zip = match.addressComponents?.zip ?? null;

    return {
      lat,
      lon,
      accuracy: null,
      precision: 'approximate',
      provider: 'import',
      normalizedAddress: match.matchedAddress as string | undefined,
      zip,
    };
  } catch (error) {
    logWarn('Census geocoder error', error);
    return null;
  }
}

async function resolveViaNominatim(address: string): Promise<CoordinateResolution | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('q', address);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en-US',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      logWarn('Nominatim lookup failed', response.status, address.slice(0, 32));
      return null;
    }

    const data = await response.json();
    const result = Array.isArray(data) ? data[0] : null;
    if (!result) return null;

    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return null;
    }

    const zip = result.address?.postcode ?? null;

    return {
      lat,
      lon,
      accuracy: null,
      precision: 'approximate',
      provider: 'import',
      normalizedAddress: result.display_name as string | undefined,
      zip,
    };
  } catch (error) {
    logWarn('Nominatim lookup error', error);
    return null;
  }
}

async function resolveViaGoogleGeocode(address: string): Promise<CoordinateResolution | null> {
  const apiKey = process.env.GOOGLE_MAPS_GEOCODE_API_KEY || process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      logWarn('Google geocode failed', response.status, address.slice(0, 32));
      return null;
    }

    const data = await response.json();
    if (data.status !== 'OK' || !data.results?.length) {
      return null;
    }

    const result = data.results[0];
    const lat = result.geometry?.location?.lat;
    const lon = result.geometry?.location?.lng;
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return null;
    }

    const zipComponent = result.address_components?.find((c: any) => c.types?.includes('postal_code'));
    const zip = zipComponent?.long_name ?? null;

    return {
      lat,
      lon,
      accuracy: null,
      precision: 'approximate',
      provider: 'import',
      normalizedAddress: result.formatted_address as string | undefined,
      zip,
    };
  } catch (error) {
    logWarn('Google geocode error', error);
    return null;
  }
}

function ensureCoordinates(coordinates: CoordinateResolution | null, input: ResolverInput) {
  if (coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lon)) {
    return { lat: coordinates.lat, lon: coordinates.lon };
  }
  if (typeof input.latitude === 'number' && typeof input.longitude === 'number') {
    return { lat: input.latitude, lon: input.longitude };
  }
  return null;
}

function normalizePrecision(precision: GeoPrecision | undefined, accuracy?: number | null, fallbackAccuracy?: number | null): GeoPrecision {
  if (precision && precision !== 'unknown') {
    return precision;
  }
  const effectiveAccuracy = accuracy ?? fallbackAccuracy ?? null;
  if (effectiveAccuracy === null) return 'approximate';
  if (effectiveAccuracy <= 50) return 'exact';
  if (effectiveAccuracy <= 500) return 'approximate';
  return 'city';
}

async function mapToJurisdictions(params: {
  supabase: Supabase;
  zip?: string | null;
  lat: number | null;
  lon: number | null;
  providerChain: string[];
  address?: string;
}) {
  const { supabase, zip, lat, lon, providerChain } = params;

  const jurisdictionIds = new Set<string>();
  let aliasConfidence: number | null = null;

  if (zip) {
    const aliasMatch = await lookupAliasByZip(supabase, zip);
    if (aliasMatch) {
      jurisdictionIds.add(aliasMatch.ocd_division_id);
      aliasConfidence = aliasMatch.confidence ?? aliasConfidence;
    }
  }

  if (jurisdictionIds.size === 0 && typeof lat === 'number' && typeof lon === 'number') {
    const tileMatch = await lookupTileByCoordinates(supabase, lat, lon);
    if (tileMatch) {
      jurisdictionIds.add(tileMatch.ocd_division_id);
    }
  }

  let googleJurisdictions: string[] = [];
  if (jurisdictionIds.size === 0 && params.address) {
    googleJurisdictions = await lookupGoogleJurisdictions(params.address, providerChain);
    googleJurisdictions.forEach(id => jurisdictionIds.add(id));
  }

  const primaryOcdId = jurisdictionIds.values().next().value ?? null;
  let jurisdictionName: string | null = null;
  if (primaryOcdId) {
    jurisdictionName = await fetchJurisdictionName(supabase, primaryOcdId);
  }

  return {
    jurisdictionIds: Array.from(jurisdictionIds),
    primaryOcdId,
    jurisdictionName,
    aliasConfidence,
  };
}

async function lookupAliasByZip(supabase: Supabase, zip: string) {
  const { data, error } = await supabase
    .from('jurisdiction_aliases')
    .select('ocd_division_id, confidence')
    .eq('alias_type', 'zip')
    .eq('alias_value', zip)
    .order('confidence', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logWarn('Lookup alias by zip failed', zip, error.message);
    return null;
  }
  return data as Pick<JurisdictionAlias, 'ocd_division_id' | 'confidence'> | null;
}

async function lookupTileByCoordinates(supabase: Supabase, lat: number, lon: number) {
  const coarse = createTileKey(lat, lon);
  const { data, error } = await supabase
    .from('jurisdiction_tiles')
    .select('ocd_division_id')
    .eq('h3_index', coarse)
    .limit(1)
    .maybeSingle();

  if (error) {
    logWarn('Lookup tile failed', lat, lon, error.message);
    return null;
  }
  return data as Pick<JurisdictionTile, 'ocd_division_id'> | null;
}

async function lookupGoogleJurisdictions(address: string, providerChain: string[]): Promise<string[]> {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) return [];

  try {
    const url = new URL('https://www.googleapis.com/civicinfo/v2/representatives');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('address', address);
    url.searchParams.set('includeOffices', 'true');
    url.searchParams.set('levels', 'country,administrativeArea1,administrativeArea2,locality');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      logWarn('Google Civic reps failed', response.status);
      return [];
    }

    providerChain.push('google-civic');
    const data = await response.json();
    const divisions = data?.divisions ?? {};
    return Object.keys(divisions).filter((id) => id.startsWith('ocd-division/'));
  } catch (error) {
    logWarn('Google Civic reps error', error);
    return [];
  }
}

async function fetchJurisdictionName(supabase: Supabase, ocdId: string) {
  const { data, error } = await supabase
    .from('civic_jurisdictions')
    .select('name')
    .eq('ocd_division_id', ocdId)
    .maybeSingle();

  if (error) {
    logWarn('Fetch jurisdiction name failed', ocdId, error.message);
    return null;
  }

  return (data as Pick<CivicJurisdiction, 'name'> | null)?.name ?? null;
}

async function upsertUserResolution(params: {
  supabase: Supabase;
  userId: string;
  consentVersion: number;
  lat: number | null;
  lon: number | null;
  accuracy: number | null;
  precision: GeoPrecision;
  source: ResolverOutcome['provider'];
  coarseHash: string | null;
  zip?: string | null;
  primaryOcd: string | null;
  address?: string;
}): Promise<{ resolution: UserLocationResolution; action: 'granted' | 'regranted' }>
{
  const {
    supabase,
    userId,
    consentVersion,
    lat,
    lon,
    accuracy,
    precision,
    source,
    coarseHash,
    primaryOcd,
    address,
  } = params;

  const quantizedLat = quantizeCoordinate(lat);
  const quantizedLon = quantizeCoordinate(lon);

  const { data: existing, error: fetchError } = await supabase
    .from('user_location_resolutions')
    .select('*')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch existing location resolution: ${fetchError.message}`);
  }

  const capturedAt = new Date().toISOString();

  const payload = {
    user_id: userId,
    address_hash: address ? generateAddressHMAC(address) : null,
    resolved_ocd_id: primaryOcd,
    lat_q11: quantizedLat,
    lon_q11: quantizedLon,
    accuracy_m: accuracy,
    geo_precision: precision,
    source,
    consent_version: consentVersion,
    consent_scope: 'demographics',
    coarse_hash: coarseHash,
    metadata: {
      source,
      recorded_at: capturedAt,
    },
    captured_at: capturedAt,
  } satisfies Partial<UserLocationResolution> & { user_id: string };

  if (existing) {
    const { data, error } = await supabase
      .from('user_location_resolutions')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update location resolution: ${error.message}`);

    return { resolution: data as UserLocationResolution, action: 'regranted' };
  }

  const { data, error } = await supabase
    .from('user_location_resolutions')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert location resolution: ${error.message}`);

  return { resolution: data as UserLocationResolution, action: 'granted' };
}

async function recordConsentAudit(params: {
  supabase: Supabase;
  userId: string;
  resolutionId: string;
  action: 'granted' | 'regranted';
  providerChain: string[];
  precision: GeoPrecision;
  primaryOcd: string | null;
}) {
  const { supabase, userId, resolutionId, action, providerChain, precision, primaryOcd } = params;

  const { error } = await supabase
    .from('location_consent_audit')
    .insert({
      user_id: userId,
      resolution_id: resolutionId,
      action,
      scope: 'demographics',
      actor: 'user',
      metadata: {
        provider_chain: providerChain,
        precision,
        primary_ocd: primaryOcd,
      },
    });

  if (error) {
    logWarn('Failed to record consent audit', error.message);
  }
}

async function updateUserProfileGeo(params: {
  supabase: Supabase;
  userId: string;
  lat: number | null;
  lon: number | null;
  precision: GeoPrecision;
  source: ResolverOutcome['provider'];
  consentVersion: number;
  coarseHash: string | null;
}) {
  const { supabase, userId, lat, lon, precision, source, consentVersion, coarseHash } = params;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('user_profiles')
    .update({
      geo_lat: quantizeCoordinate(lat),
      geo_lon: quantizeCoordinate(lon),
      geo_precision: precision,
      geo_updated_at: now,
      geo_source: source,
      geo_consent_version: consentVersion,
      geo_coarse_hash: coarseHash,
      geo_trust_gate: 'all',
    })
    .eq('user_id', userId);

  if (error) {
    logWarn('Failed to update user profile geo fields', error.message);
  }
}

async function getLatestConsentVersion(supabase: Supabase, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_consent')
    .select('consent_version')
    .eq('user_id', userId)
    .eq('consent_type', 'demographics')
    .order('granted_at', { ascending: false })
    .limit(1);

  if (error) {
    logWarn('Failed to fetch consent version', error.message);
    return 1;
  }
  return data?.[0]?.consent_version ?? 1;
}

function quantizeCoordinate(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return Math.round(value * 1e6) / 1e6;
}

function createCoarseHash(lat: number, lon: number, requestId: string): string {
  try {
    return geohashWithJitter(lat, lon, 6, requestId);
  } catch {
    return createTileKey(lat, lon);
  }
}

function createTileKey(lat: number, lon: number): string {
  const latBucket = Math.round(lat * 100) / 100;
  const lonBucket = Math.round(lon * 100) / 100;
  return `grid:${latBucket.toFixed(2)}:${lonBucket.toFixed(2)}`;
}

function sanitizeZip(zip?: string | null): string | null {
  if (!zip) return null;
  const digits = zip.replace(/[^0-9]/g, '');
  if (digits.length >= 5) {
    return digits.substring(0, 5);
  }
  return null;
}

function extractZipFromAddress(address?: string) {
  if (!address) return null;
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}

function createTileKeyForOcd(ocdId: string): { state?: string | undefined; county?: string | undefined; district?: string | undefined } {
  const stateMatch = ocdId.match(/\/state:([^\/]+)/);
  const countyMatch = ocdId.match(/\/county:([^\/]+)/);
  const districtMatch = ocdId.match(/\/(?:sldl|sldu|cd|district):([^\/:]+)/);
  return {
    state: stateMatch?.[1]?.toUpperCase() || undefined,
    county: countyMatch?.[1] || undefined,
    district: districtMatch?.[1] || undefined,
  };
}

export function deriveCookiePayload(ocdId?: string | null) {
  if (!ocdId) {
    return { state: undefined, county: undefined, district: undefined };
  }
  const parts = createTileKeyForOcd(ocdId);
  return {
    state: parts.state,
    county: parts.county,
    district: parts.district,
  };
}
