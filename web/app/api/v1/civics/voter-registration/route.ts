import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError, errorResponse, rateLimitError } from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIP = forwarded.split(',')[0];
    if (firstIP) {
      return firstIP.trim();
    }
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return request.ip ?? 'unknown';
}

const STATE_CODE_REGEX = /^[A-Za-z]{2}$/;

function extractStateFromDivision(division: string | null): string | null {
  if (!division) return null;
  const match = division.match(/state:([a-z]{2})/i);
  if (!match) return null;
  return match[1]?.toUpperCase() ?? null;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Rate limiting: 30 requests per 5 minutes per IP (admin-like endpoint)
  const clientIP = getClientIP(request);
  const rateLimitResult = await apiRateLimiter.checkLimit(clientIP, '/api/v1/civics/voter-registration', {
    maxRequests: 30,
    windowMs: 5 * 60 * 1000, // 5 minutes
  });

  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for civics voter-registration', { ip: clientIP });
    return rateLimitError('Rate limit exceeded', rateLimitResult.retryAfter);
  }

  // Get Supabase client (uses anon key, RLS allows anonymous reads)
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { searchParams } = new URL(request.url);
  const stateParam = searchParams.get('state');
  const divisionParam = searchParams.get('division');

  let stateCode = stateParam?.trim().toUpperCase() ?? '';
  if (!stateCode && divisionParam) {
    stateCode = extractStateFromDivision(divisionParam) ?? '';
  }

  if (!stateCode) {
    return validationError({ state: 'Provide a two-letter state code or division with state segment.' });
  }

  if (!STATE_CODE_REGEX.test(stateCode)) {
    return validationError({ state: 'Invalid state code.' });
  }

  const { data, error } = await supabase
    .from('voter_registration_resources_view')
    .select(
      'state_code,election_office_name,online_url,mail_form_url,mailing_address,status_check_url,special_instructions,sources,metadata,last_verified,updated_at',
    )
    .eq('state_code', stateCode)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return errorResponse('Failed to load voter registration resources', 502, {
      reason: error.message
    });
  }

  const response = successResponse(
    {
      state: stateCode,
      registration: data ?? null
    },
    {
      source: 'supabase',
      view: 'voter_registration_resources_view'
    }
  );

  response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  response.headers.set('ETag', `"voter-registration-${stateCode}-${data?.updated_at ?? 'none'}"`);

  return response;
});


