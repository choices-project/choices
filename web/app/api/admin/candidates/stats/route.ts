/**
 * Admin: Candidate Onboarding Stats
 *
 * GET /api/admin/candidates/stats
 *
 * Returns statistics about candidate profiles including:
 * - Total candidate count
 * - Public candidate count
 * - Fast-track linked candidates
 * - Filing status breakdown
 *
 * Authentication: Requires x-admin-key header matching ADMIN_MONITORING_KEY
 * Rate Limiting: 30 requests per 5 minutes per IP
 *
 * Response Format:
 * {
 *   timestamp: string (ISO 8601)
 *   candidates: {
 *     total: number
 *     public: number
 *     fastTrackLinked: number
 *     status: Record<string, number> (filing_status -> count)
 *   }
 * }
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  withErrorHandling,
  successResponse,
  forbiddenError,
  errorResponse,
  methodNotAllowed,
  rateLimitError,
} from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

const ADMIN_STATS_RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 5 * 60 * 1000, // 5 minutes
};

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Admin authentication
  const adminHeader =
    request.headers.get('x-admin-key') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    '';
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? '';
  if (!adminKey || adminHeader !== adminKey) {
    logger.warn('Admin stats endpoint: Invalid admin key', {
      hasHeader: !!request.headers.get('x-admin-key'),
      hasAuth: !!request.headers.get('authorization'),
    });
    return forbiddenError('Invalid admin key');
  }

  // Rate limiting
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const userAgent = request.headers.get('user-agent');
  const rateLimitResult = await apiRateLimiter.checkLimit(clientIp, 'admin:candidates:stats', {
    ...ADMIN_STATS_RATE_LIMIT,
    ...(userAgent ? { userAgent } : {}),
  });

  if (!rateLimitResult.allowed) {
    logger.warn('Admin stats endpoint: Rate limit exceeded', {
      ip: clientIp,
      totalHits: rateLimitResult.totalHits,
    });
    return rateLimitError(
      'Too many requests. Please wait before retrying.',
      rateLimitResult.retryAfter ?? Math.ceil(ADMIN_STATS_RATE_LIMIT.windowMs / 1000),
    );
  }

  // Database connection check
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Admin stats endpoint: Database connection not available');
    return errorResponse('Database connection not available', 503);
  }

  try {
    // Execute queries in parallel with error handling
    const [totalResult, publicResult, statusResult, fastTrackResult] = await Promise.allSettled([
      (supabase as any).from('candidate_profiles').select('id', { count: 'exact', head: true }),
      (supabase as any)
        .from('candidate_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_public', true),
      (supabase as any)
        .from('candidate_profiles')
        .select('filing_status, count:count(*)')
        .group('filing_status'),
      (supabase as any)
        .from('candidate_profiles')
        .select('id', { count: 'exact', head: true })
        .not('representative_id', 'is', null),
    ]);

    // Extract counts with fallbacks
    const total =
      totalResult.status === 'fulfilled' ? totalResult.value.count ?? 0 : 0;
    const publicCount =
      publicResult.status === 'fulfilled' ? publicResult.value.count ?? 0 : 0;
    const fastTrackLinked =
      fastTrackResult.status === 'fulfilled' ? fastTrackResult.value.count ?? 0 : 0;

    // Process status breakdown
    let statusBreakdown: Record<string, number> = {};
    if (statusResult.status === 'fulfilled' && Array.isArray(statusResult.value.data)) {
      statusBreakdown = (statusResult.value.data as Array<{ filing_status?: string | null; count?: number | null }>).reduce<Record<string, number>>((acc, r) => {
        const k = String(r.filing_status ?? 'unknown');
        acc[k] = (acc[k] ?? 0) + Number(r.count ?? 0);
        return acc;
      }, {});
    } else if (statusResult.status === 'rejected') {
      logger.warn('Admin stats endpoint: Failed to fetch status breakdown', statusResult.reason);
    }

    // Log query errors for monitoring
    const errors = [
      totalResult.status === 'rejected' ? 'total' : null,
      publicResult.status === 'rejected' ? 'public' : null,
      statusResult.status === 'rejected' ? 'status' : null,
      fastTrackResult.status === 'rejected' ? 'fastTrack' : null,
    ].filter(Boolean);

    if (errors.length > 0) {
      logger.error('Admin stats endpoint: Some queries failed', { errors });
    }

    return successResponse({
      timestamp: new Date().toISOString(),
      candidates: {
        total,
        public: publicCount,
        fastTrackLinked,
        status: statusBreakdown,
      },
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      },
    });
  } catch (error) {
    logger.error('Admin stats endpoint: Unexpected error', error);
    return errorResponse('Failed to fetch candidate statistics', 500);
  }
});

export const POST = withErrorHandling(async () => methodNotAllowed(['GET']));

