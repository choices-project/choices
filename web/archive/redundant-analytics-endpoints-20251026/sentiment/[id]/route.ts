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
            voter_session
          )
        )
      `)
      .eq('id', pollId)
      .single();

    if (pollError || !pollData) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Perform sentiment analysis using the query optimizer
    const sentimentAnalysis = await queryOptimizer.executeQuery(
      supabase,
      `sentiment_analysis_${pollId}`,
      async () => {
        return await performSentimentAnalysis(pollData);
      },
      300000 // 5 minutes cache
    );

    return NextResponse.json({
      success: true,
      data: sentimentAnalysis.data,
      timestamp: new Date().toISOString(),
      analysis_method: 'sophisticated_sentiment',
      cache_hit: sentimentAnalysis.fromCache,
      deprecation_warning: {
        message: "This endpoint is deprecated. Please use /api/analytics/unified/[id]?methods=sentiment",
        deprecated_since: "2025-10-26",
        removal_date: "2025-11-26",
        migration_guide: "Replace with: GET /api/analytics/unified/{id}?methods=sentiment&ai-provider=colab"
      }
    });

  } catch (error) {
    logger.error('Sentiment analysis error:', error as Error);
    return NextResponse.json(
      { error: 'Failed to perform sentiment analysis' },
      { status: 500 }
    );
  }
}

async function performSentimentAnalysis(pollData: any) {
  const votes = pollData.poll_options.flatMap((opt: any) => opt.votes);
  
  // Group votes by trust tier
  const tierBreakdown: Record<string, any> = {};
  const trustTiers = [0, 1, 2, 3]; // T0, T1, T2, T3
  
  trustTiers.forEach(tier => {
    const tierVotes = votes.filter((vote: any) => vote.trust_tier === tier);
    const tierKey = `tier_${tier}`;
    
    // Analyze sentiment for this tier
    const sentimentScore = analyzeTierSentiment(tierVotes, pollData);
    
    tierBreakdown[tierKey] = {
      sentiment_score: sentimentScore.score,
      confidence: sentimentScore.confidence,
      key_themes: sentimentScore.themes,
      emotional_tone: sentimentScore.tone
    };
  });

  // Calculate narrative divergence
  const narrativeDivergence = calculateNarrativeDivergence(tierBreakdown);

  return {
    data: {
      tier_breakdown: tierBreakdown,
      narrative_divergence: narrativeDivergence
    },
    error: null
  };
}

function analyzeTierSentiment(votes: any[], pollData: any) {
  if (votes.length === 0) {
    return {
      score: 0,
      confidence: 0,
      themes: [],
      tone: 'neutral'
    };
  }

  // Analyze voting patterns for sentiment
  const optionVotes = pollData.poll_options.map((opt: any) => {
    const tierVotes = votes.filter((vote: any) => 
      opt.votes.some((v: any) => v.id === vote.id)
    );
    return {
      option: opt.text,
      votes: tierVotes.length,
      percentage: votes.length > 0 ? tierVotes.length / votes.length : 0
    };
  });

  // Determine sentiment based on voting distribution
  const maxVotes = Math.max(...optionVotes.map((o: { votes: number }) => o.votes));
  const dominantOption = optionVotes.find((o: { votes: number }) => o.votes === maxVotes);
  
  // Simple sentiment scoring based on option text analysis
  const sentimentKeywords = {
    positive: ['support', 'agree', 'yes', 'good', 'better', 'improve', 'help'],
    negative: ['oppose', 'disagree', 'no', 'bad', 'worse', 'harm', 'against'],
    neutral: ['neutral', 'unsure', 'maybe', 'consider']
  };

  let sentimentScore = 0;
  let emotionalTone = 'neutral';
  let keyThemes: string[] = [];

  if (dominantOption) {
    const text = dominantOption.option.toLowerCase();
    
    // Check for sentiment keywords
    const positiveCount = sentimentKeywords.positive.filter(word => text.includes(word)).length;
    const negativeCount = sentimentKeywords.negative.filter(word => text.includes(word)).length;
    const neutralCount = sentimentKeywords.neutral.filter(word => text.includes(word)).length;

    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      sentimentScore = 0.3 + (positiveCount * 0.1);
      emotionalTone = 'positive';
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      sentimentScore = -0.3 - (negativeCount * 0.1);
      emotionalTone = 'negative';
    } else {
      sentimentScore = 0;
      emotionalTone = 'neutral';
    }

    // Extract themes
    const themeKeywords = {
      'politics': ['government', 'policy', 'election', 'vote', 'democracy'],
      'economy': ['economy', 'economic', 'financial', 'budget', 'tax'],
      'social': ['social', 'community', 'public', 'citizen', 'rights'],
      'environment': ['environment', 'climate', 'green', 'sustainable'],
      'health': ['health', 'healthcare', 'medical', 'wellness']
    };

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        keyThemes.push(theme);
      }
    });
  }

  const confidence = Math.min(0.9, votes.length / 10); // More votes = higher confidence

  return {
    score: Math.max(-1, Math.min(1, sentimentScore)),
    confidence,
    themes: keyThemes,
    tone: emotionalTone
  };
}

function calculateNarrativeDivergence(tierBreakdown: Record<string, any>) {
  const tiers = Object.keys(tierBreakdown);
  if (tiers.length < 2) {
    return {
      score: 0,
      explanation: 'Insufficient data for divergence analysis',
      manipulation_indicators: []
    };
  }

  // Calculate variance in sentiment scores across tiers
  const sentimentScores = Object.values(tierBreakdown).map((tier: any) => tier.sentiment_score);
  const mean = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
  const variance = sentimentScores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / sentimentScores.length;
  
  const divergenceScore = Math.min(1, variance * 2); // Normalize to 0-1

  let explanation = 'Low narrative divergence detected';
  const manipulationIndicators: string[] = [];

  if (divergenceScore > 0.7) {
    explanation = 'High narrative divergence detected - potential manipulation';
    manipulationIndicators.push('trust tier gaming');
    manipulationIndicators.push('coordinated behavior');
  } else if (divergenceScore > 0.4) {
    explanation = 'Moderate narrative divergence detected';
    manipulationIndicators.push('unusual voting patterns');
  }

  return {
    score: divergenceScore,
    explanation,
    manipulation_indicators: manipulationIndicators
  };
}