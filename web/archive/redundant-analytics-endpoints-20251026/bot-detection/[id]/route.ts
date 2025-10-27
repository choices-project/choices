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

    // Get poll data with votes and trust tier information
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        poll_options!inner(
          id,
          text,
          votes!inner(
            id,
            created_at,
            trust_tier,
            user_id,
            voter_session,
            ip_address
          )
        )
      `)
      .eq('id', pollId)
      .single();

    if (pollError || !pollData) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Perform bot detection using the query optimizer
    const botDetection = await queryOptimizer.executeQuery(
      supabase,
      `bot_detection_${pollId}`,
      async () => {
        return await performBotDetection(pollData);
      },
      300000 // 5 minutes cache
    );

    return NextResponse.json({
      success: true,
      data: botDetection.data,
      timestamp: new Date().toISOString(),
      analysis_method: 'sophisticated_bot_detection',
      cache_hit: botDetection.fromCache,
      deprecation_warning: {
        message: "This endpoint is deprecated. Please use /api/analytics/unified/[id]?methods=bot-detection",
        deprecated_since: "2025-10-26",
        removal_date: "2025-11-26",
        migration_guide: "Replace with: GET /api/analytics/unified/{id}?methods=bot-detection&ai-provider=colab"
      }
    });

  } catch (error) {
    logger.error('Bot detection error:', error as Error);
    return NextResponse.json(
      { error: 'Failed to perform bot detection' },
      { status: 500 }
    );
  }
}

async function performBotDetection(pollData: any) {
  const votes = pollData.poll_options.flatMap((opt: any) => opt.votes);
  
  if (votes.length === 0) {
    return {
      data: {
        suspicious_activity: 0,
        coordinated_behavior: false,
        rapid_voting_patterns: false,
        ip_clustering: false,
        overall_bot_probability: 0
      },
      error: null
    };
  }

  // Analyze voting patterns for bot detection
  const votingPatterns = analyzeVotingPatterns(votes);
  const coordinationAnalysis = analyzeCoordinationPatterns(votes);
  const ipAnalysis = analyzeIPPatterns(votes);
  const rapidVotingAnalysis = analyzeRapidVotingPatterns(votes);

  // Calculate overall bot probability
  const overallBotProbability = calculateOverallBotProbability(
    votingPatterns,
    coordinationAnalysis,
    ipAnalysis,
    rapidVotingAnalysis
  );

  return {
    data: {
      suspicious_activity: votingPatterns.suspiciousScore,
      coordinated_behavior: coordinationAnalysis.isCoordinated,
      rapid_voting_patterns: rapidVotingAnalysis.hasRapidPatterns,
      ip_clustering: ipAnalysis.hasClustering,
      overall_bot_probability: overallBotProbability
    },
    error: null
  };
}

function analyzeVotingPatterns(votes: any[]) {
  // Analyze timing patterns
  const timestamps = votes.map(v => new Date(v.created_at).getTime()).sort();
  const timeIntervals = [];
  
  for (let i = 1; i < timestamps.length; i++) {
    const current = timestamps[i];
    const previous = timestamps[i - 1];
    if (current !== undefined && previous !== undefined) {
      timeIntervals.push(current - previous);
    }
  }

  // Detect unusual patterns
  const avgInterval = timeIntervals.reduce((a, b) => a + b, 0) / timeIntervals.length;
  const rapidIntervals = timeIntervals.filter(interval => interval < 1000); // Less than 1 second
  const rapidRatio = rapidIntervals.length / timeIntervals.length;

  // Analyze trust tier distribution
  const trustTiers = votes.map(v => v.trust_tier);
  const tierCounts = trustTiers.reduce((acc, tier) => {
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const totalVotes = votes.length;
  const anonymousRatio = (tierCounts[0] || 0) / totalVotes;
  const verifiedRatio = (tierCounts[3] || 0) / totalVotes;

  // Calculate suspicious score
  let suspiciousScore = 0;
  if (rapidRatio > 0.3) suspiciousScore += 0.4;
  if (anonymousRatio > 0.8) suspiciousScore += 0.3;
  if (verifiedRatio < 0.1 && totalVotes > 20) suspiciousScore += 0.3;

  return {
    suspiciousScore: Math.min(1, suspiciousScore),
    rapidRatio,
    anonymousRatio,
    verifiedRatio,
    avgInterval
  };
}

function analyzeCoordinationPatterns(votes: any[]) {
  // Analyze for coordinated behavior
  const timestamps = votes.map(v => new Date(v.created_at).getTime()).sort();
  
  // Look for burst patterns (many votes in short time)
  const burstThreshold = 5; // votes within 1 minute
  const burstWindow = 60000; // 1 minute in milliseconds
  
  let burstCount = 0;
  for (let i = 0; i < timestamps.length; i++) {
    const currentTime = timestamps[i];
    if (currentTime === undefined) continue;
    
    const votesInWindow = timestamps.filter(t => 
      t >= currentTime && t <= currentTime + burstWindow
    ).length;
    
    if (votesInWindow >= burstThreshold) {
      burstCount++;
    }
  }

  // Analyze session patterns
  const sessions = votes.map(v => v.voter_session).filter(Boolean);
  const sessionCounts = sessions.reduce((acc, session) => {
    acc[session] = (acc[session] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sessionValues = Object.values(sessionCounts) as number[];
  const avgVotesPerSession = sessionValues.reduce((a, b) => a + b, 0) / sessionValues.length;
  const highVolumeSessions = sessionValues.filter(count => count > avgVotesPerSession * 2).length;

  const isCoordinated = burstCount > 2 || highVolumeSessions > Object.keys(sessionCounts).length * 0.3;

  return {
    isCoordinated,
    burstCount,
    highVolumeSessions,
    avgVotesPerSession
  };
}

function analyzeIPPatterns(votes: any[]) {
  // Analyze IP addresses for clustering
  const ipAddresses = votes.map(v => v.ip_address).filter(Boolean);
  
  if (ipAddresses.length === 0) {
    return { hasClustering: false, uniqueIPs: 0, totalVotes: votes.length };
  }

  const ipCounts = ipAddresses.reduce((acc, ip) => {
    acc[ip] = (acc[ip] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueIPs = Object.keys(ipCounts).length;
  const totalVotes = votes.length;
  const ipConcentration = uniqueIPs / totalVotes;

  // Check for IP clustering (same IP with many votes)
  const ipValues = Object.values(ipCounts) as number[];
  const maxVotesPerIP = Math.max(...ipValues);
  const hasClustering = ipConcentration < 0.3 || maxVotesPerIP > totalVotes * 0.5;

  return {
    hasClustering,
    uniqueIPs,
    totalVotes,
    ipConcentration,
    maxVotesPerIP
  };
}

function analyzeRapidVotingPatterns(votes: any[]) {
  if (votes.length < 2) {
    return { hasRapidPatterns: false, rapidRatio: 0 };
  }

  const timestamps = votes.map(v => new Date(v.created_at).getTime()).sort();
  const rapidIntervals = timestamps.slice(1).map((time, i) => {
    const prevTime = timestamps[i];
    return prevTime !== undefined ? time - prevTime : 0;
  }).filter(interval => interval < 1000); // Less than 1 second

  const rapidRatio = rapidIntervals.length / (votes.length - 1);
  const hasRapidPatterns = rapidRatio > 0.2; // More than 20% rapid votes

  return {
    hasRapidPatterns,
    rapidRatio,
    rapidCount: rapidIntervals.length
  };
}

function calculateOverallBotProbability(
  votingPatterns: any,
  coordinationAnalysis: any,
  ipAnalysis: any,
  rapidVotingAnalysis: any
): number {
  let botProbability = 0;

  // Weight different factors
  if (votingPatterns.suspiciousScore > 0.7) botProbability += 0.3;
  if (coordinationAnalysis.isCoordinated) botProbability += 0.25;
  if (ipAnalysis.hasClustering) botProbability += 0.25;
  if (rapidVotingAnalysis.hasRapidPatterns) botProbability += 0.2;

  return Math.min(1, botProbability);
}