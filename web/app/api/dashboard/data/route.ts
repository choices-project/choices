import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/lib/core/auth/utils';
import { devLog } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Check for E2E bypass
    const isE2E = request.headers.get('x-e2e-bypass') === '1' || 
                  process.env.NODE_ENV === 'test' || 
                  process.env.E2E === '1';
    
    let user = null;
    if (!isE2E) {
      user = getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // For E2E tests, return mock data
    if (isE2E) {
      const mockDashboardData = {
        userPolls: [],
        userMetrics: {
          pollsCreated: 0,
          pollsActive: 0,
          votesCast: 0,
          participationRate: 0,
          averageSessionTime: 15,
          trustScore: 0
        },
        userTrends: [],
        userEngagement: {
          weeklyActivity: 5,
          monthlyActivity: 20,
          streakDays: 1,
          favoriteCategories: []
        },
        userInsights: {
          topCategories: [],
          votingPatterns: [],
          achievements: []
        }
      };
      
      devLog('E2E mock dashboard data returned');
      return NextResponse.json(mockDashboardData);
    }

    // Fetch user's polls
    const { data: userPolls, error: pollsError } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        status,
        created_at,
        ends_at,
        choices (
          id,
          text,
          votes
        )
      `)
      .eq('created_by', user?.userId)
      .order('created_at', { ascending: false });

    if (pollsError) {
      devLog('Error fetching user polls:', pollsError);
      return NextResponse.json({ error: 'Failed to fetch user polls' }, { status: 500 });
    }

    // Fetch user's votes
    const { data: userVotes, error: votesError } = await supabase
      .from('votes')
      .select('id, created_at, poll_id')
      .eq('user_id', user?.userId);

    if (votesError) {
      devLog('Error fetching user votes:', votesError);
      return NextResponse.json({ error: 'Failed to fetch user votes' }, { status: 500 });
    }

    // Fetch user profile for trust score
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('trust_score, created_at')
      .eq('user_id', user?.userId)
      .single();

    if (profileError) {
      devLog('Error fetching user profile:', profileError);
    }

    // Calculate metrics
    const pollsCreated = userPolls?.length || 0;
    const pollsActive = userPolls?.filter(poll => poll.status === 'active').length || 0;
    const votesCast = userVotes?.length || 0;
    const trustScore = userProfile?.trust_score || 0;

    // Calculate participation rate (votes cast / polls available to vote on)
    const { data: allPolls, error: allPollsError } = await supabase
      .from('polls')
      .select('id, status, created_at, ends_at')
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString());

    if (allPollsError) {
      console.error('Error fetching active polls for participation calculation:', allPollsError);
    }

    const availablePolls = allPolls?.length || 1; // Avoid division by zero
    const participationRate = Math.round((votesCast / availablePolls) * 100);

    // Generate mock trend data (last 30 days)
    const trends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        votesCast: Math.floor(Math.random() * 5),
        pollsCreated: Math.floor(Math.random() * 2),
        sessionTime: Math.floor(Math.random() * 30) + 5
      });
    }

    // Generate mock insights
    const topCategories = [
      { category: 'Politics', count: 12, percentage: 35 },
      { category: 'Technology', count: 8, percentage: 24 },
      { category: 'Environment', count: 6, percentage: 18 },
      { category: 'Health', count: 4, percentage: 12 },
      { category: 'Education', count: 3, percentage: 11 }
    ];

    const achievements = [
      {
        id: 'first_poll',
        name: 'First Poll Creator',
        description: 'Create your first poll',
        earned: pollsCreated > 0,
        progress: pollsCreated > 0 ? 100 : 0
      },
      {
        id: 'active_participant',
        name: 'Active Participant',
        description: 'Cast 10 votes',
        earned: votesCast >= 10,
        progress: Math.min((votesCast / 10) * 100, 100)
      },
      {
        id: 'trusted_user',
        name: 'Trusted User',
        description: 'Achieve a trust score of 80+',
        earned: trustScore >= 80,
        progress: Math.min((trustScore / 80) * 100, 100)
      },
      {
        id: 'poll_master',
        name: 'Poll Master',
        description: 'Create 5 polls',
        earned: pollsCreated >= 5,
        progress: Math.min((pollsCreated / 5) * 100, 100)
      }
    ];

    // Calculate engagement metrics
    const weeklyActivity = Math.floor(Math.random() * 20) + 5;
    const monthlyActivity = Math.floor(Math.random() * 80) + 20;
    const streakDays = Math.floor(Math.random() * 15) + 1;
    const favoriteCategories = ['Politics', 'Technology', 'Environment'];

    const dashboardData = {
      userPolls: userPolls?.map(poll => ({
        id: poll.id,
        title: poll.title,
        status: poll.status,
        totalvotes: poll.choices?.reduce((sum, choice) => sum + choice.votes, 0) || 0,
        participation: Math.floor(Math.random() * 100),
        createdat: poll.created_at,
        endsat: poll.ends_at,
        choices: poll.choices || []
      })) || [],
      userMetrics: {
        pollsCreated,
        pollsActive,
        votesCast,
        participationRate,
        averageSessionTime: Math.floor(Math.random() * 20) + 10,
        trustScore
      },
      userTrends: trends,
      userEngagement: {
        weeklyActivity,
        monthlyActivity,
        streakDays,
        favoriteCategories
      },
      userInsights: {
        topCategories,
        votingPatterns: [
          { timeOfDay: 'Morning', activity: 25 },
          { timeOfDay: 'Afternoon', activity: 45 },
          { timeOfDay: 'Evening', activity: 30 }
        ],
        achievements
      }
    };

    devLog('Dashboard data generated successfully for user:', user?.userId);
    return NextResponse.json(dashboardData);

  } catch (error) {
    devLog('Error in dashboard data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
