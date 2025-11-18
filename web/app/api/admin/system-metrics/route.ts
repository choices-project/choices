import type { NextRequest } from 'next/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';
import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const supabaseClient = await getSupabaseServerClient();

  if (!supabaseClient) {
    return errorResponse('Supabase client unavailable', 500);
  }

  const [topicsResult, pollsResult] = await Promise.all([
    supabaseClient.from('trending_topics').select('id, processing_status'),
    supabaseClient.from('polls').select('id, status'),
  ]);

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

  return successResponse({ metrics });
});
