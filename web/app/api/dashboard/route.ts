/**
 * Consolidated Dashboard API Endpoint
 * 
 * This endpoint consolidates all dashboard functionality:
 * - Main dashboard data
 * - Additional dashboard data
 * - User-specific statistics
 * - Platform statistics
 * 
 * Usage:
 * GET /api/dashboard - Main dashboard data (requires auth)
 * GET /api/dashboard?include=data,stats,activity - All dashboard data (requires auth)
 * GET /api/dashboard?include=stats - Platform statistics only (requires auth)
 * GET /api/dashboard?include=activity - Recent activity only (requires auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include') || 'basic';
    const includeArray = include.split(',').map(item => item.trim());

    // Get Supabase client
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabaseClient = await supabase;

    // Always require authentication - no E2E bypasses
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const user = session.user;
    const results: any = {
      user: {
        id: user.id,
        email: user.email,
        name: user.email?.split('@')[0]
      },
      generatedAt: new Date().toISOString()
    };

    // Basic dashboard data (always included)
    if (includeArray.includes('basic') || includeArray.includes('data')) {
      results.stats = await getUserStats(supabase, user.id);
      results.platform = await getPlatformStats(supabase);
      results.recentActivity = await getRecentActivity(supabase, user.id);
      results.polls = await getActivePolls(supabase);
    }

    // Additional statistics
    if (includeArray.includes('stats')) {
      results.detailedStats = await getDetailedStats(supabase, user.id);
    }

    // Recent activity
    if (includeArray.includes('activity')) {
      results.recentActivity = await getRecentActivity(supabase, user.id);
    }

    // Voting patterns
    if (includeArray.includes('patterns')) {
      results.votingPatterns = await calculateVotingPatterns(supabase, user.id);
    }

    return NextResponse.json(results);

  } catch (error) {
    logger.error('Dashboard API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getUserStats(supabase: any, userId: string) {
  try {
    // Get user's polls
    const { data: userPolls, error: pollsError } = await supabase
      .from('polls')
      .select('id, title, total_votes, created_at')
      .eq('created_by', userId)
      .eq('is_active', true);

    if (pollsError) {
      logger.error('Error fetching user polls:', pollsError);
    }

    // Get user's votes
    const { data: userVotes, error: votesError } = await supabase
      .from('votes')
      .select('id, poll_id, created_at')
      .eq('user_id', userId);

    if (votesError) {
      logger.error('Error fetching user votes:', votesError);
    }

    // Get user's comments
    const { data: userComments, error: commentsError } = await supabase
      .from('comments')
      .select('id, poll_id, created_at')
      .eq('user_id', userId);

    if (commentsError) {
      logger.error('Error fetching user comments:', commentsError);
    }

    return {
      pollsCreated: userPolls?.length || 0,
      totalVotes: userVotes?.length || 0,
      totalComments: userComments?.length || 0,
      recentPolls: userPolls?.slice(0, 5) || [],
      recentVotes: userVotes?.slice(0, 10) || []
    };

  } catch (error) {
    logger.error('Error in getUserStats:', error);
    return {
      pollsCreated: 0,
      totalVotes: 0,
      totalComments: 0,
      recentPolls: [],
      recentVotes: []
    };
  }
}

async function getPlatformStats(supabase: any) {
  try {
    // Get total polls
    const { count: totalPolls, error: pollsError } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (pollsError) {
      logger.error('Error fetching total polls:', pollsError);
    }
    
    // Get total votes
    const { data: pollsWithVotes, error: votesError } = await supabase
      .from('polls')
      .select('total_votes')
      .eq('is_active', true);
    
    if (votesError) {
      logger.error('Error fetching total votes:', votesError);
    }
    
    const totalVotes = pollsWithVotes?.reduce((sum: number, poll: { total_votes: number | null }) => sum + (poll.total_votes || 0), 0) || 0;
    
    // Get active users (users who have voted in the last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activeUsers, error: usersError } = await supabase
      .from('votes')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo)
      .not('user_id', 'is', null);
    
    if (usersError) {
      logger.error('Error fetching active users:', usersError);
    }

    return {
      totalPolls: totalPolls || 0,
      totalVotes,
      activeUsers: activeUsers || 0
    };

  } catch (error) {
    logger.error('Error in getPlatformStats:', error);
    return {
      totalPolls: 0,
      totalVotes: 0,
      activeUsers: 0
    };
  }
}

async function getRecentActivity(supabase: any, userId: string) {
  try {
    // Get recent votes
    const { data: recentVotes, error: votesError } = await supabase
      .from('votes')
      .select(`
        id,
        poll_id,
        created_at,
        polls (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (votesError) {
      logger.error('Error fetching recent votes:', votesError);
    }

    // Get recent comments
    const { data: recentComments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        poll_id,
        content,
        created_at,
        polls (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (commentsError) {
      logger.error('Error fetching recent comments:', commentsError);
    }

    // Get recent polls created
    const { data: recentPolls, error: pollsError } = await supabase
      .from('polls')
      .select('id, title, created_at, total_votes')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (pollsError) {
      logger.error('Error fetching recent polls:', pollsError);
    }

    return {
      votes: recentVotes || [],
      comments: recentComments || [],
      polls: recentPolls || []
    };

  } catch (error) {
    logger.error('Error in getRecentActivity:', error);
    return {
      votes: [],
      comments: [],
      polls: []
    };
  }
}

async function getActivePolls(supabase: any) {
  try {
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        description,
        category,
        created_at,
        end_date,
        total_votes,
        options (
          id,
          text,
          votes
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Error fetching active polls:', error);
      return [];
    }

    return polls || [];

  } catch (error) {
    logger.error('Error in getActivePolls:', error);
    return [];
  }
}

async function getDetailedStats(supabase: any, userId: string) {
  try {
    // Get voting patterns
    const votingPatterns = await calculateVotingPatterns(supabase, userId);
    
    // Get engagement metrics
    const { data: engagementData, error: engagementError } = await supabase
      .from('votes')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (engagementError) {
      logger.error('Error fetching engagement data:', engagementError);
    }

    // Calculate engagement score
    const engagementScore = engagementData ? engagementData.length : 0;

    return {
      votingPatterns,
      engagementScore,
      lastActive: engagementData?.[0]?.created_at || null
    };

  } catch (error) {
    logger.error('Error in getDetailedStats:', error);
    return {
      votingPatterns: {},
      engagementScore: 0,
      lastActive: null
    };
  }
}

async function calculateVotingPatterns(supabase: any, userId: string) {
  try {
    // Get user's voting history
    const { data: votes, error } = await supabase
      .from('votes')
      .select(`
        created_at,
        polls (
          category,
          voting_method
        )
      `)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error fetching voting patterns:', error);
      return {};
    }

    // Analyze patterns
    const patterns = {
      totalVotes: votes?.length || 0,
      categories: {} as Record<string, number>,
      methods: {} as Record<string, number>,
      timePatterns: {} as Record<string, number>
    };

    votes?.forEach((vote: any) => {
      const category = vote.polls?.category || 'Unknown';
      const method = vote.polls?.voting_method || 'Unknown';
      const hour = new Date(vote.created_at).getHours();
      const timeSlot = hour < 6 ? 'Night' : hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

      patterns.categories[category] = (patterns.categories[category] || 0) + 1;
      patterns.methods[method] = (patterns.methods[method] || 0) + 1;
      patterns.timePatterns[timeSlot] = (patterns.timePatterns[timeSlot] || 0) + 1;
    });

    return patterns;

  } catch (error) {
    logger.error('Error in calculateVotingPatterns:', error);
    return {};
  }
}