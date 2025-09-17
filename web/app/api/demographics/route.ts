import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { getMockDemographicsResponse } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get total users
    const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, user_id, username, email, trust_tier, created_at, updated_at, avatar_url, bio, is_active')
        .eq('is_active', true);

      if (usersError) throw usersError;

      const totalUsers = users?.length || 0;

      // Get recent polls
      const { data: polls, error: pollsError } = await supabase
        .from('polls')
        .select('id, title, total_votes, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (pollsError) throw pollsError;

      // Get recent votes
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('poll_id, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (votesError) throw votesError;

      // Generate demographics data with real user count
      const demographics = getMockDemographicsResponse();
      const response = {
        ...demographics,
        totalUsers,
        recentPolls: (polls || []).map(poll => ({
          id: poll.id,
          question: poll.title,
          options: [],
          createdAt: poll.created_at,
          votes: poll.total_votes
        })),
        recentVotes: (votes || []) as any[]
      };

      return NextResponse.json(response);
    } catch (error) {
      devLog('Error in demographics API:', error);
      // Always return mock data as final fallback
      return NextResponse.json(getMockDemographicsResponse());
    }
}
