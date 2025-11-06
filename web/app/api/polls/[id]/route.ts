import type { NextRequest} from 'next/server';

import { withErrorHandling, successResponse, notFoundError, errorResponse } from '@/lib/api';
import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const pollId = id;
    
    // Always use regular client - no E2E bypasses
    const supabaseClient = await getSupabaseServerClient();
    
    // Fetch poll data from polls table
    const { data: poll, error } = await supabaseClient
      .from('polls')
      .select('id, title, description, options, total_votes, participation, status, privacy_level, category, voting_method, end_time, created_at')
      .eq('id', pollId)
      .single();

  if (error || !poll) {
    return notFoundError('Poll not found');
  }

    // Return sanitized poll data with privacy info
    const sanitizedPoll = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      options: poll.options,
      totalvotes: poll.total_votes ?? 0,
      participation: poll.participation ?? 0,
      status: poll.status ?? 'active',
      privacyLevel: poll.privacy_level ?? 'public',
      category: poll.category,
      votingMethod: poll.voting_method ?? 'single',
      endtime: poll.end_time,
      createdAt: poll.created_at,
    };

  return successResponse(sanitizedPoll);
});
