/**
 * Analytics Dashboard API
 *
 * Provides aggregated analytics data for dashboard components.
 * Replaces mock data with real Supabase queries.
 *
 * Created: November 30, 2025
 */

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, authError as authErrorResponse, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

type UserGrowthData = {
  date: string;
  users: number;
};

type PollActivityData = {
  date: string;
  polls: number;
  votes: number;
};

type VotingMethodData = {
  method: string;
  count: number;
  percentage: number;
};

type SystemPerformanceData = {
  averageResponseTime: number;
  uptime: number;
  errorRate: number;
};

type AnalyticsDashboardData = {
  userGrowth: UserGrowthData[];
  pollActivity: PollActivityData[];
  votingMethods: VotingMethodData[];
  systemPerformance: SystemPerformanceData;
};

/**
 * Get user growth data (last 7 days)
 */
async function getUserGrowth(supabase: any, days: number = 7): Promise<UserGrowthData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get user counts by date
    const { data, error } = await supabase
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching user growth:', error);
      return [];
    }

    // Group by date and count
    const dateMap = new Map<string, number>();
    let cumulative = 0;

    // Get initial user count before start date
    const { count: initialCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', startDateStr);

    cumulative = initialCount ?? 0;

    // Process each day
    const result: UserGrowthData[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0] || '';

      const dayUsers = data?.filter(
        (user: any) => user.created_at?.startsWith(dateStr)
      ).length ?? 0;

      cumulative += dayUsers;
      result.push({
        date: dateStr,
        users: cumulative,
      });
    }

    return result;
  } catch (error) {
    logger.error('Error in getUserGrowth:', error);
    return [];
  }
}

/**
 * Get poll activity data (last 7 days)
 */
async function getPollActivity(supabase: any, days: number = 7): Promise<PollActivityData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get polls by date
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('id, created_at')
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: true });

    if (pollsError) {
      logger.error('Error fetching polls:', pollsError);
      return [];
    }

    // Get votes by date
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('id, created_at')
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: true });

    if (votesError) {
      logger.error('Error fetching votes:', votesError);
      return [];
    }

    // Group by date
    const result: PollActivityData[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0] || '';

      const dayPolls = polls?.filter(
        (poll: any) => poll.created_at?.startsWith(dateStr)
      ).length ?? 0;

      const dayVotes = votes?.filter(
        (vote: any) => vote.created_at?.startsWith(dateStr)
      ).length ?? 0;

      result.push({
        date: dateStr,
        polls: dayPolls,
        votes: dayVotes,
      });
    }

    return result;
  } catch (error) {
    logger.error('Error in getPollActivity:', error);
    return [];
  }
}

/**
 * Get voting method distribution
 */
async function getVotingMethods(supabase: any): Promise<VotingMethodData[]> {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('voting_method')
      .not('voting_method', 'is', null);

    if (error) {
      logger.error('Error fetching voting methods:', error);
      return [];
    }

    // Count by method
    const methodMap = new Map<string, number>();
    let total = 0;

    data?.forEach((poll: any) => {
      const method = poll.voting_method || 'Unknown';
      methodMap.set(method, (methodMap.get(method) || 0) + 1);
      total++;
    });

    // Convert to array with percentages
    const result: VotingMethodData[] = Array.from(methodMap.entries())
      .map(([method, count]) => ({
        method: method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, ' '),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return result;
  } catch (error) {
    logger.error('Error in getVotingMethods:', error);
    return [];
  }
}

/**
 * Get system performance metrics (placeholder - would integrate with monitoring)
 */
async function getSystemPerformance(): Promise<SystemPerformanceData> {
  // TODO: Integrate with actual performance monitoring
  // For now, return placeholder data
  return {
    averageResponseTime: 120,
    uptime: 99.9,
    errorRate: 0.1,
  };
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Check authentication
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return authErrorResponse('Authentication required');
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') ?? '7', 10);

    // Fetch all analytics data in parallel
    const [userGrowth, pollActivity, votingMethods, systemPerformance] = await Promise.all([
      getUserGrowth(supabase, days),
      getPollActivity(supabase, days),
      getVotingMethods(supabase),
      getSystemPerformance(),
    ]);

    const data: AnalyticsDashboardData = {
      userGrowth,
      pollActivity,
      votingMethods,
      systemPerformance,
    };

    return successResponse(data);
  } catch (error) {
    logger.error('Error fetching analytics dashboard data:', error);
    return errorResponse('Failed to fetch analytics data', 500);
  }
});

