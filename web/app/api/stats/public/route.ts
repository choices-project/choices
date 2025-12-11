import { getSupabaseServerClient } from '@/utils/supabase/server'

import { withErrorHandling, successResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async () => {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    logger.warn('Supabase client unavailable for public stats');
    return successResponse(
      {
        totalPolls: 0,
        totalVotes: 0,
        activeUsers: 0,
      },
      {
        window: '30d',
        source: 'mock',
        mode: 'degraded',
      }
    );
  }

  const { count: totalPolls, error: pollsError } = await supabase
    .from('polls')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (pollsError) {
    logger.error('Error fetching total polls:', pollsError);
  }

  const { data: pollsWithVotes, error: votesError } = await supabase
    .from('polls')
    .select('total_votes')
    .eq('is_active', true);

  if (votesError) {
    logger.error('Error fetching total votes:', votesError);
  }

  const totalVotes =
    pollsWithVotes?.reduce(
      (sum: number, poll: { total_votes: number | null }) => sum + (poll.total_votes ?? 0),
      0
    ) ?? 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: activeUsers, error: usersError } = await supabase
    .from('votes')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo)
    .not('user_id', 'is', null);

  if (usersError) {
    logger.error('Error fetching active users:', usersError);
  }

  return successResponse(
    {
      totalPolls: totalPolls ?? 0,
      totalVotes,
      activeUsers: activeUsers ?? 0,
    },
    {
      window: '30d',
      source: 'supabase',
    }
  );
});
