import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, errorResponse, rateLimitError } from '@/lib/api';
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

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Rate limiting: 100 requests per 15 minutes per IP
  const clientIP = getClientIP(request);
  const rateLimitResult = await apiRateLimiter.checkLimit(clientIP, '/api/v1/civics/elections', {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for civics elections', { ip: clientIP });
    return rateLimitError('Rate limit exceeded', rateLimitResult.retryAfter);
  }

  // Get Supabase client (uses anon key, RLS allows anonymous reads)
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { searchParams } = new URL(request.url);
  const divisionsParam = searchParams.get('divisions');
  const divisions = divisionsParam
    ? divisionsParam
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : null;

  const { data, error } = await supabase.rpc('get_upcoming_elections', {
    divisions: divisions ?? undefined
  });

  if (error) {
    return errorResponse('Failed to load upcoming elections', 502, { reason: error.message });
  }

  const elections = data ?? [];

  return successResponse(
    {
      elections,
      count: elections.length
    },
    {
      source: 'supabase',
      filters: divisions ? { divisions } : undefined
    }
  );
});


