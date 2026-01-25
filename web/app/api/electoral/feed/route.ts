/**
 * Electoral Feed API
 *
 * GET /api/electoral/feed
 *
 * Returns a geographic electoral feed (officials, races, key issues, engagement)
 * for the authenticated user and location.
 *
 * Query params (no address — we never save address):
 *   - district — e.g. CA-11 (from Civics address lookup or manual input). Primary.
 *   - zipCode — opt-in only; used for geocode when district not provided.
 *   - lat,lng — optional fallback for geocode when neither district nor zipCode.
 * Auth: required (session user id used as feed userId)
 *
 * Used by: Electoral tab, civics UI. Wires GeographicElectoralFeed.
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { createGeographicElectoralFeed } from '@/lib/electoral/geographic-feed';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Service unavailable', 503);
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse('Unauthorized', 401);
  }

  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district') ?? undefined;
  const zipCode = searchParams.get('zipCode') ?? undefined;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const coordinates =
    lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))
      ? { lat: Number(lat), lng: Number(lng) }
      : undefined;

  const locationInput = {
    ...(district && { district: district.trim() }),
    ...(zipCode && { zipCode: zipCode.trim() }),
    ...(coordinates && { coordinates }),
  };

  const feedService = createGeographicElectoralFeed();
  const feed = await feedService.generateElectoralFeed(user.id, locationInput);

  return successResponse({ feed });
});
