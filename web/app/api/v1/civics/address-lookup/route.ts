/**
 * Civics Address Lookup API Endpoint
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 * 
 * Privacy-first address lookup with jurisdiction cookie setting
 */

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { assertPepperConfig } from '@/lib/civics/env-guard';
import { setJurisdictionCookie } from '@/lib/civics/privacy-utils';
import { resolveAndPersistLocation, deriveCookiePayload } from '@/lib/civics/location-resolver.server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { verifyAuthToken } from '@/lib/core/auth/utils';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logWarn } from '@/lib/logger';

// assertPepperConfig(); // Moved to route handlers to avoid build-time execution

const RATE_LIMIT_WINDOW_MS = 30_000;

type AddressLookupRequest = {
  address?: string;
  zip?: string;
  coords?: {
    lat?: number;
    lon?: number;
    accuracy?: number | null;
  };
  latitude?: number;
  longitude?: number;
  accuracy?: number | null;
};

export async function POST(request: Request) {
  // Assert pepper configuration at runtime, not build time
  assertPepperConfig();
  
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP') || !isFeatureEnabled('BROWSER_LOCATION_CAPTURE')) {
    return NextResponse.json({ error: 'Location capture is disabled' }, { status: 404 });
  }

  const cookieStore = cookies();
  const authHeader = request.headers.get('authorization');
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const cookieToken = cookieStore.get('auth-token')?.value ?? null;
  const token = bearer ?? cookieToken ?? null;

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const user = verifyAuthToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: AddressLookupRequest;
  try {
    body = (await request.json()) as AddressLookupRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const address = typeof body.address === 'string' && body.address.trim().length > 0 ? body.address.trim() : undefined;
  const zip = typeof body.zip === 'string' ? body.zip : undefined;

  const coords = body.coords ?? {};
  const latitude = typeof coords.lat === 'number' ? coords.lat : typeof body.latitude === 'number' ? body.latitude : undefined;
  const longitude = typeof coords.lon === 'number' ? coords.lon : typeof body.longitude === 'number' ? body.longitude : undefined;
  const accuracy = typeof coords.accuracy === 'number' ? coords.accuracy : typeof body.accuracy === 'number' ? body.accuracy : null;

  if (!address && (latitude === undefined || longitude === undefined) && !zip) {
    return NextResponse.json({ error: 'Provide address, coordinates, or zip' }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();

  const { data: recent, error: recentError } = await supabase
    .from('user_location_resolutions')
    .select('captured_at')
    .eq('user_id', user.userId)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentError) {
    logWarn('Location lookup rate-limit check failed', recentError.message);
  }

  if (recent?.captured_at) {
    const capturedAt = new Date(recent.captured_at).getTime();
    const now = Date.now();
    if (!Number.isNaN(capturedAt) && now - capturedAt < RATE_LIMIT_WINDOW_MS) {
      return NextResponse.json({ error: 'Please wait before requesting another location lookup' }, { status: 429 });
    }
  }

  const requestId = crypto.randomUUID();

  try {
    const result = await resolveAndPersistLocation({
      supabase,
      userId: user.userId,
      input: {
        address: address || undefined,
        zip: zip || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        accuracy,
        requestId,
      },
    });

    if (!result.jurisdictionIds.length) {
      return NextResponse.json({ error: 'Jurisdiction not found for supplied location' }, { status: 422 });
    }

    const cookiePayload = deriveCookiePayload(result.primaryOcdId ?? null);
    const sanitizedPayload = {
      state: cookiePayload.state || undefined,
      county: cookiePayload.county || undefined,
      district: cookiePayload.district || undefined,
    } as { state?: string; county?: string; district?: string };
    await setJurisdictionCookie(sanitizedPayload);

    return NextResponse.json({
      ok: true,
      location: {
        lat: result.lat,
        lon: result.lon,
        accuracy: result.accuracy ?? null,
        precision: result.precision,
        provider: result.provider,
        jurisdictionIds: result.jurisdictionIds,
        primaryOcdId: result.primaryOcdId ?? null,
        jurisdictionName: result.jurisdictionName ?? null,
        aliasConfidence: result.aliasConfidence ?? null,
        coarseHash: result.coarseHash ?? null,
        storedAt: result.storedResolution.captured_at,
        consentVersion: result.storedResolution.consent_version,
      },
    });
  } catch (error) {
    logWarn('Address lookup failed', error);
    const message = error instanceof Error ? error.message : 'Unable to resolve location';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE(request: Request) {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP') || !isFeatureEnabled('BROWSER_LOCATION_CAPTURE')) {
    return NextResponse.json({ error: 'Location capture is disabled' }, { status: 404 });
  }

  const cookieStore = cookies();
  const authHeader = request.headers.get('authorization');
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const cookieToken = cookieStore.get('auth-token')?.value ?? null;
  const token = bearer ?? cookieToken ?? null;

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const user = verifyAuthToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const supabase = await getSupabaseServerClient();

  const { data: existing, error } = await supabase
    .from('user_location_resolutions')
    .select('*')
    .eq('user_id', user.userId)
    .is('revoked_at', null)
    .maybeSingle();

  if (error) {
    logWarn('Failed to fetch existing location resolution for deletion', error.message);
    return NextResponse.json({ error: 'Failed to revoke location' }, { status: 500 });
  }

  if (!existing) {
    await setJurisdictionCookie({});
    return NextResponse.json({ ok: true, location: null });
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('user_location_resolutions')
    .update({ revoked_at: now })
    .eq('id', existing.id);

  if (updateError) {
    logWarn('Failed to revoke location resolution', updateError.message);
    return NextResponse.json({ error: 'Failed to revoke location' }, { status: 500 });
  }

  const { error: auditError } = await supabase
    .from('location_consent_audit')
    .insert({
      user_id: user.userId,
      resolution_id: existing.id,
      action: 'revoked',
      scope: 'demographics',
      actor: 'user',
      metadata: {
        previous_precision: existing.geo_precision,
        revoked_at: now,
      },
    });

  if (auditError) {
    logWarn('Failed to write location consent audit (revoked)', auditError.message);
  }

  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      geo_lat: null,
      geo_lon: null,
      geo_precision: null,
      geo_updated_at: now,
      geo_source: null,
      geo_consent_version: null,
      geo_coarse_hash: null,
      geo_trust_gate: 'all',
    })
    .eq('user_id', user.userId);

  if (profileError) {
    logWarn('Failed to clear cached profile geo fields', profileError.message);
  }

  await setJurisdictionCookie({});

  return NextResponse.json({ ok: true, location: null });
}
