import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';
import queryOptimizer from '@/lib/database/query-optimizer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const supabase = await getSupabaseServerClient();

    // Get poll data with votes and timing information
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        created_at,
        poll_options!inner(
          id,
          text,
          votes!inner(
            id,
            created_at,
            trust_tier,
            user_id,
            voter_session
          )
        )
      `)
      .eq('id', pollId)
      .single();

    if (pollError || !pollData) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Perform temporal analysis using the query optimizer
    const temporalAnalysis = await queryOptimizer.executeQuery(
      supabase,
      `temporal_analysis_${pollId}`,
      async () => {
        return await performTemporalAnalysis(pollData);
      },
      300000 // 5 minutes cache
    );

    return NextResponse.json({
      success: true,
      data: temporalAnalysis.data,
      timestamp: new Date().toISOString(),
      analysis_method: 'sophisticated_temporal',
      cache_hit: temporalAnalysis.fromCache
    });

  } catch (error) {
    logger.error('Temporal analysis error:', error as Error);
    return NextResponse.json(
      { error: 'Failed to perform temporal analysis' },
      { status: 500 }
    );
  }
}

async function performTemporalAnalysis(pollData: any) {
  const votes = pollData.poll_options.flatMap((opt: any) => opt.votes);
  
  if (votes.length === 0) {
    return {
      data: {
        voting_patterns: {
          peak_hours: [],
          day_of_week_distribution: [],
          time_series_data: []
        },
        viral_coefficient: 0,
        engagement_velocity: 0
      },
      error: null
    };
  }

  // Analyze voting patterns over time
  const votingPatterns = analyzeVotingPatterns(votes);
  const viralCoefficient = calculateViralCoefficient(votes, pollData);
  const engagementVelocity = calculateEngagementVelocity(votes, pollData);

  return {
    data: {
      voting_patterns: votingPatterns,
      viral_coefficient: viralCoefficient,
      engagement_velocity: engagementVelocity
    },
    error: null
  };
}

function analyzeVotingPatterns(votes: any[]) {
  // Analyze hourly patterns
  const hourlyVotes = new Map<number, number>();
  const dailyVotes = new Map<number, number>();
  const timeSeriesData: Array<{
    timestamp: string;
    vote_count: number;
    trust_tier_breakdown: Record<string, number>;
  }> = [];

  votes.forEach(vote => {
    const voteTime = new Date(vote.created_at);
    const hour = voteTime.getHours();
    const dayOfWeek = voteTime.getDay();

    // Count hourly votes
    hourlyVotes.set(hour, (hourlyVotes.get(hour) || 0) + 1);
    
    // Count daily votes
    dailyVotes.set(dayOfWeek, (dailyVotes.get(dayOfWeek) || 0) + 1);

    // Create time series data (grouped by hour)
    const hourKey = `${voteTime.toISOString().split('T')[0]}T${hour.toString().padStart(2, '0')}:00:00Z`;
    const existingEntry = timeSeriesData.find(entry => entry.timestamp === hourKey);
    
    if (existingEntry) {
      existingEntry.vote_count++;
      const tierKey = `tier_${vote.trust_tier}`;
      existingEntry.trust_tier_breakdown[tierKey] = (existingEntry.trust_tier_breakdown[tierKey] || 0) + 1;
    } else {
      timeSeriesData.push({
        timestamp: hourKey,
        vote_count: 1,
        trust_tier_breakdown: {
          [`tier_${vote.trust_tier}`]: 1
        }
      });
    }
  });

  // Find peak hours (top 3 hours with most votes)
  const peakHours = Array.from(hourlyVotes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => hour);

  // Create day of week distribution (0 = Sunday, 6 = Saturday)
  const dayOfWeekDistribution = Array.from({ length: 7 }, (_, i) => dailyVotes.get(i) || 0);

  // Sort time series data by timestamp
  timeSeriesData.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return {
    peak_hours: peakHours,
    day_of_week_distribution: dayOfWeekDistribution,
    time_series_data: timeSeriesData
  };
}

function calculateViralCoefficient(votes: any[], pollData: any) {
  if (votes.length < 2) return 0;

  // Calculate how quickly votes spread
  const timestamps = votes.map(v => new Date(v.created_at).getTime()).sort();
  const pollCreatedTime = new Date(pollData.created_at).getTime();
  
  // Calculate time intervals
  const timeIntervals = timestamps.slice(1).map((time, i) => {
    const prevTime = timestamps[i];
    return prevTime !== undefined ? time - prevTime : 0;
  });

  // Calculate acceleration (how intervals change over time)
  const accelerations = timeIntervals.slice(1).map((interval, i) => {
    const prevInterval = timeIntervals[i];
    if (prevInterval === undefined) return 0;
    return prevInterval > 0 ? (prevInterval - interval) / prevInterval : 0;
  });

  // Calculate viral coefficient based on acceleration
  const avgAcceleration = accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
  const viralCoefficient = Math.max(0, avgAcceleration * 10); // Scale and ensure positive

  return Math.min(5, viralCoefficient); // Cap at 5
}

function calculateEngagementVelocity(votes: any[], pollData: any) {
  if (votes.length === 0) return 0;

  const pollCreatedTime = new Date(pollData.created_at).getTime();
  const lastVoteTime = Math.max(...votes.map(v => new Date(v.created_at).getTime()));
  
  // Calculate total time span in hours
  const totalTimeSpanHours = (lastVoteTime - pollCreatedTime) / (1000 * 60 * 60);
  
  if (totalTimeSpanHours === 0) return votes.length;

  // Calculate votes per hour
  const votesPerHour = votes.length / totalTimeSpanHours;

  return Math.round(votesPerHour * 10) / 10; // Round to 1 decimal place
}