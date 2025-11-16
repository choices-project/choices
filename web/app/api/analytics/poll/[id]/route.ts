import type { NextRequest} from 'next/server';

import { applyAnalyticsCacheHeaders } from '@/lib/analytics/cache-headers';
import { withErrorHandling, successResponse, validationError, errorResponse } from '@/lib/api';
import { AnalyticsService } from '@/lib/core/services/analytics'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const pollId = params.id

  if (!pollId) {
    return validationError({ pollId: 'Poll ID is required' });
  }

  try {
    const analyticsService = AnalyticsService.getInstance()
    const pollAnalytics = await analyticsService.getPollAnalytics(pollId)

    const response = successResponse({
      poll: pollAnalytics
    });

    return applyAnalyticsCacheHeaders(response, {
      cacheKey: `analytics:poll:${pollId}`,
      etagSeed: `${pollId}:${pollAnalytics?.demographic_insights?.updated_at ?? pollAnalytics?.poll_id ?? 'poll'}`,
      ttlSeconds: 180,
      scope: 'private',
    });
  } catch (error) {
    return errorResponse(
      'Failed to load poll analytics',
      500,
      error instanceof Error ? { message: error.message } : undefined,
      'ANALYTICS_POLL_FAILED'
    );
  }
});
