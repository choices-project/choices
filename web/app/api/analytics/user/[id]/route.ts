import type { NextRequest} from 'next/server';

import { withErrorHandling, successResponse, validationError } from '@/lib/api';
import { AnalyticsService } from '@/lib/core/services/analytics'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const userId = params.id

  if (!userId) {
    return validationError({ userId: 'User ID is required' });
  }

  const analyticsService = AnalyticsService.getInstance()
  const userAnalytics = await analyticsService.getUserAnalytics(userId)

  return successResponse({
    data: userAnalytics
  });
});
