import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, validationError, errorResponse } from '@/lib/api';
import { AnalyticsService } from '@/lib/core/services/analytics';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const userId = params.id;

  if (!userId) {
    return validationError({ userId: 'User ID is required' });
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse('Authentication required', 401);
  }

  if (user.id !== userId) {
    const { data: profile } = await supabase.from('user_profiles').select('is_admin').eq('user_id', user.id).single();
    if (!profile?.is_admin) {
      return errorResponse('Access denied', 403);
    }
  }

  const analyticsService = AnalyticsService.getInstance();
  const userAnalytics = await analyticsService.getUserAnalytics(userId);

  return successResponse({
    user: userAnalytics,
  });
});
