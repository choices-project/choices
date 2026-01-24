/**
 * Admin: System Metrics API
 *
 * GET /api/admin/system-metrics
 *
 * Returns system-wide metrics including:
 * - Total topics/feedback
 * - Total polls and active polls
 * - System health status
 *
 * Authentication: Requires admin authentication
 * Error Handling: Comprehensive error handling with logging
 * Logging: All operations logged for observability
 */

import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const startTime = Date.now();
  
  const authGate = await requireAdminOr401();
  if (authGate) {
    logger.warn('Admin system-metrics: Unauthorized access attempt', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return authGate;
  }

  const adminClient = await getSupabaseAdminClient();

  if (!adminClient) {
    logger.error('Admin system-metrics: Supabase admin client unavailable');
    return errorResponse('Supabase client unavailable', 500);
  }

  try {
    const [topicsResult, pollsResult] = await Promise.all([
      adminClient.from('trending_topics').select('id, processing_status'),
      adminClient.from('polls').select('id, status'),
    ]);

    // Log errors for observability
    if (topicsResult.error) {
      logger.error('Admin system-metrics: Failed to fetch topics', {
        error: topicsResult.error.message,
        code: topicsResult.error.code,
      });
    }

    if (pollsResult.error) {
      logger.error('Admin system-metrics: Failed to fetch polls', {
        error: pollsResult.error.message,
        code: pollsResult.error.code,
      });
    }

    // Return error if critical queries failed
    if (topicsResult.error || pollsResult.error) {
      return errorResponse('Failed to load system metrics', 500, {
        topicsError: topicsResult.error?.message,
        pollsError: pollsResult.error?.message,
      });
    }

    const totalTopics = topicsResult.data?.length ?? 0;
    const totalPolls = pollsResult.data?.length ?? 0;
    const activePolls = pollsResult.data?.filter((poll) => poll?.status === 'active').length ?? 0;

    const metrics = {
      totalTopics,
      totalPolls,
      activePolls,
      systemHealth: 'healthy',
      lastUpdated: new Date().toISOString(),
    };

    const loadTime = Date.now() - startTime;
    logger.info('Admin system-metrics: Successfully loaded metrics', {
      totalTopics,
      totalPolls,
      activePolls,
      loadTime,
    });

    return successResponse({ metrics });
  } catch (error) {
    logger.error('Admin system-metrics: Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse('An unexpected error occurred while loading metrics', 500);
  }
});
