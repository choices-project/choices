import type { NextRequest} from 'next/server';

import { requireAdminOr401 } from '@/lib/admin-auth';
import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  const supabase = getSupabaseServerClient();
  const supabaseClient = await supabase;
  
  if (!supabaseClient) {
    return errorResponse('Supabase client not available', 500);
  }
    
    // Fetch real metrics from database
    const [topicsResult, pollsResult] = await Promise.all([
      (supabaseClient as any).from('trending_topics').select('id, processing_status'),
      (supabaseClient as any).from('generated_polls').select('id, status')
    ]);

    const totalTopics = topicsResult.data?.length ?? 0;
    const totalPolls = pollsResult.data?.length ?? 0;
    const activePolls = pollsResult.data?.filter((poll: any) => poll && 'status' in poll && poll.status === 'active').length ?? 0;

    const metrics = {
      total_topics: totalTopics,
      total_polls: totalPolls,
      active_polls: activePolls,
      system_health: 'healthy',
      last_updated: new Date().toISOString()
    };

  return successResponse({ metrics });
});
