import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { getMockDemographicsResponse } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async () => {
    const supabase = await getSupabaseServerClient();
    
    // Parallelize independent queries to eliminate waterfall
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const [usersResult, pollsResult, votesResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, user_id, username, email, trust_tier, created_at, updated_at, avatar_url, bio, is_active')
        .eq('is_active', true),
      supabase
        .from('polls')
        .select('id, title, total_votes, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('votes')
        .select('poll_id, created_at')
        .gte('created_at', yesterday)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    if (usersResult.error) {
      return errorResponse('Failed to load user demographics', 502, { reason: usersResult.error.message });
    }

    if (pollsResult.error) {
      return errorResponse('Failed to load polls', 502, { reason: pollsResult.error.message });
    }

    if (votesResult.error) {
      return errorResponse('Failed to load votes', 502, { reason: votesResult.error.message });
    }

    const totalUsers = usersResult.data?.length || 0;
    const polls = pollsResult.data || [];
    const votes = votesResult.data || [];

      // Generate demographics data with real user count
      const demographics = getMockDemographicsResponse();
      const response = {
        ...demographics,
        totalUsers,
        recentPolls: polls.map(poll => ({
          id: poll.id,
          question: poll.title,
          options: [],
          createdAt: poll.created_at,
          votes: poll.total_votes
        })),
        recentVotes: votes as any[]
      };

    return successResponse(response);
});
