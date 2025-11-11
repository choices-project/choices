import type { NextRequest} from 'next/server';

import { requireAdminOr401 } from '@/lib/admin-auth';
import { withErrorHandling, successResponse } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const authGate = await requireAdminOr401()
  if (authGate) return authGate

  const supabaseClient = await getSupabaseServerClient();

    // Fetch real metrics from database
    const [topicsResult, pollsResult] = await Promise.all([
      supabaseClient.from('trending_topics').select('id, processing_status'),
      supabaseClient.from('polls').select('id, status')
    ]);

    const totalTopics = topicsResult.data?.length ?? 0;
    const totalPolls = pollsResult.data?.length ?? 0;
    const activePolls = pollsResult.data?.filter((poll) => poll?.status === 'active').length ?? 0;

    const metrics = {
      total_topics: totalTopics,
      total_polls: totalPolls,
      active_polls: activePolls,
      system_health: 'healthy',
      last_updated: new Date().toISOString()
    };

  return successResponse({ metrics });
});
