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

    // Get poll data with votes and user information
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
            voter_session
          )
        )
      `)
      .eq('id', pollId)
      .single();

    if (pollError || !pollData) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Perform trust tier results analysis using the query optimizer
    const trustTierResults = await queryOptimizer.executeQuery(
      supabase,
      `trust_tier_results_${pollId}`,
      async () => {
        return await performTrustTierAnalysis(pollData);
      },
      300000 // 5 minutes cache
    );

    return NextResponse.json({
      success: true,
      data: trustTierResults.data,
      timestamp: new Date().toISOString(),
      analysis_method: 'sophisticated_trust_tier',
      cache_hit: trustTierResults.fromCache
    });

  } catch (error) {
    logger.error('Trust tier results error:', error as Error);
    return NextResponse.json(
      { error: 'Failed to perform trust tier analysis' },
      { status: 500 }
    );
  }
}

async function performTrustTierAnalysis(pollData: any) {
  const votes = pollData.poll_options.flatMap((opt: any) => opt.votes);
  
  if (votes.length === 0) {
    return {
      data: {
        trust_tier_distribution: { T0: 0, T1: 0, T2: 0, T3: 0 },
        tier_confidence_scores: { T0: 0, T1: 0, T2: 0, T3: 0 },
        tier_engagement_metrics: { T0: 0, T1: 0, T2: 0, T3: 0 },
        verification_impact: { biometric: 0, phone: 0, identity: 0 },
        data_quality_score: 0
      },
      error: null
    };
  }

  // Analyze trust tier distribution
  const trustTierDistribution = analyzeTrustTierDistribution(votes);
  const tierConfidenceScores = calculateTierConfidenceScores(votes);
  const tierEngagementMetrics = calculateTierEngagementMetrics(votes);
  const verificationImpact = analyzeVerificationImpact(votes);
  const dataQualityScore = calculateDataQualityScore(votes, trustTierDistribution);

  return {
    data: {
      trust_tier_distribution: trustTierDistribution,
      tier_confidence_scores: tierConfidenceScores,
      tier_engagement_metrics: tierEngagementMetrics,
      verification_impact: verificationImpact,
      data_quality_score: dataQualityScore
    },
    error: null
  };
}

function analyzeTrustTierDistribution(votes: any[]) {
  const distribution = { T0: 0, T1: 0, T2: 0, T3: 0 };
  
  votes.forEach(vote => {
    const tier = `T${vote.trust_tier}` as keyof typeof distribution;
    distribution[tier]++;
  });

  return distribution;
}

function calculateTierConfidenceScores(votes: any[]) {
  const confidenceScores = { T0: 0, T1: 0, T2: 0, T3: 0 };
  const tierCounts = { T0: 0, T1: 0, T2: 0, T3: 0 };

  votes.forEach(vote => {
    const tier = `T${vote.trust_tier}` as keyof typeof confidenceScores;
    tierCounts[tier]++;
    
    // Calculate confidence based on verification level
    let confidence = 0;
    switch (vote.trust_tier) {
      case 0: confidence = 0.1; break; // Anonymous
      case 1: confidence = 0.3; break; // Basic verification
      case 2: confidence = 0.7; break; // Phone verification
      case 3: confidence = 0.9; break; // Identity verification
      default: confidence = 0.1;
    }
    
    confidenceScores[tier] += confidence;
  });

  // Calculate average confidence scores
  Object.keys(confidenceScores).forEach(tier => {
    const tierKey = tier as keyof typeof confidenceScores;
    if (tierCounts[tierKey] > 0) {
      confidenceScores[tierKey] = confidenceScores[tierKey] / tierCounts[tierKey];
    }
  });

  return confidenceScores;
}

function calculateTierEngagementMetrics(votes: any[]) {
  const engagementMetrics = { T0: 0, T1: 0, T2: 0, T3: 0 };
  const tierCounts = { T0: 0, T1: 0, T2: 0, T3: 0 };

  // Calculate engagement based on voting patterns
  const timestamps = votes.map(v => new Date(v.created_at).getTime()).sort();
  const lastTimestamp = timestamps[timestamps.length - 1];
  const firstTimestamp = timestamps[0];
  const timeSpan = timestamps.length > 1 && lastTimestamp !== undefined && firstTimestamp !== undefined 
    ? lastTimestamp - firstTimestamp 
    : 0;

  votes.forEach(vote => {
    const tier = `T${vote.trust_tier}` as keyof typeof engagementMetrics;
    tierCounts[tier]++;
    
    // Calculate engagement score based on timing and tier
    let engagement = 0;
    const voteTime = new Date(vote.created_at).getTime();
    
    // Earlier votes get higher engagement scores
    if (timeSpan > 0 && firstTimestamp !== undefined) {
      const timeRatio = (voteTime - firstTimestamp) / timeSpan;
      engagement = 1 - timeRatio; // Earlier votes = higher engagement
    } else {
      engagement = 1;
    }
    
    // Adjust by trust tier (higher tiers = more engaged)
    engagement *= (vote.trust_tier + 1) / 4;
    
    engagementMetrics[tier] += engagement;
  });

  // Calculate average engagement metrics
  Object.keys(engagementMetrics).forEach(tier => {
    const tierKey = tier as keyof typeof engagementMetrics;
    if (tierCounts[tierKey] > 0) {
      engagementMetrics[tierKey] = engagementMetrics[tierKey] / tierCounts[tierKey];
    }
  });

  return engagementMetrics;
}

function analyzeVerificationImpact(votes: any[]) {
  // This would typically query user verification data
  // For now, we'll simulate based on trust tiers
  const verificationImpact = { biometric: 0, phone: 0, identity: 0 };
  
  const tierCounts = { T0: 0, T1: 0, T2: 0, T3: 0 };
  votes.forEach(vote => {
    const tier = `T${vote.trust_tier}` as keyof typeof tierCounts;
    tierCounts[tier]++;
  });

  // Estimate verification impact based on tier distribution
  const totalVotes = votes.length;
  
  // T1+ users likely have basic verification
  verificationImpact.biometric = (tierCounts.T1 + tierCounts.T2 + tierCounts.T3) / totalVotes;
  
  // T2+ users likely have phone verification
  verificationImpact.phone = (tierCounts.T2 + tierCounts.T3) / totalVotes;
  
  // T3 users have identity verification
  verificationImpact.identity = tierCounts.T3 / totalVotes;

  return verificationImpact;
}

function calculateDataQualityScore(votes: any[], trustTierDistribution: any) {
  if (votes.length === 0) return 0;

  // Calculate quality score based on trust tier distribution
  const totalVotes = votes.length;
  const weightedScore = 
    (trustTierDistribution.T0 * 0.1) +
    (trustTierDistribution.T1 * 0.3) +
    (trustTierDistribution.T2 * 0.7) +
    (trustTierDistribution.T3 * 0.9);

  const dataQualityScore = weightedScore / totalVotes;

  // Adjust based on vote count (more votes = higher confidence)
  const volumeAdjustment = Math.min(1, votes.length / 100);
  
  return Math.round(dataQualityScore * volumeAdjustment * 100) / 100;
}