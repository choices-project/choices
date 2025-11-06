import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, notFoundError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
    const { searchParams } = new URL(request.url);
    const trustTier = searchParams.get('tier');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Await params in Next.js 15
    const { id } = await params;

    // Validate poll exists
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, is_public')
      .eq('id', id)
      .eq('is_public', true)
      .single();

  if (pollError || !poll) {
    return notFoundError('Poll not found');
  }

    // Get results with optional trust tier filter
    const { data: results, error: resultsError } = await supabase
      .rpc('get_poll_results_by_trust_tier', {
        p_poll_id: id,
        p_trust_tier: trustTier ? parseInt(trustTier) : null
      });

  if (resultsError) {
    logger.error('Results query error:', resultsError);
    return errorResponse('Failed to get results', 500);
  }

  return successResponse({
    poll_id: id,
    trust_tier_filter: trustTier ? parseInt(trustTier) : null,
    results: results || [],
    total_votes: results?.reduce((sum: number, r: any) => sum + r.vote_count, 0) || 0
  });
});