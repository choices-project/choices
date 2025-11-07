import type { NextRequest} from 'next/server';

import { withErrorHandling, successResponse, validationError } from '@/lib/api';
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

  const analyticsService = AnalyticsService.getInstance()
  const pollAnalytics = await analyticsService.getPollAnalytics(pollId)

  return successResponse({
    data: pollAnalytics
  });
});
