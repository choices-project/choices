import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Await params in Next.js 15
    const { id } = await params;

    // Get all poll data for AI analysis
    const { data: pollData } = await supabase
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
      .eq('id', id)
      .single();

    if (!pollData) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Perform comprehensive AI analysis
    const analysis = await performComprehensiveAnalysis(pollData);

    return NextResponse.json({
      poll_id: id,
      analysis,
      platform: 'choices',
      repository: 'https://github.com/choices-project/choices',
      live_site: 'https://choices-platform.vercel.app',
      analysis_method: 'colab_ai_transparent',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI-powered analytics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      platform: 'choices',
      repository: 'https://github.com/choices-project/choices'
    }, { status: 500 });
  }
}

async function performComprehensiveAnalysis(pollData: any) {
  const sentimentAnalysis = await analyzeSentimentWithAI(pollData);
  const botDetection = await detectBotsWithAI(pollData);
  const narrativeAnalysis = await analyzeNarrativeWithAI(pollData);
  const manipulationDetection = await detectManipulationWithAI(pollData);

  return {
    sentiment_analysis: sentimentAnalysis,
    bot_detection: botDetection,
    narrative_analysis: narrativeAnalysis,
    manipulation_detection: manipulationDetection
  };
}

async function analyzeSentimentWithAI(pollData: any) {
  // Use our Google Colab AI service for real analysis
  console.log('🤖 Using Google Colab AI for sentiment analysis...');

  // Extract all text content for analysis
  const textContent = [
    pollData.question,
    ...pollData.poll_options.map((opt: any) => opt.text)
  ].join(' ');

  try {
    const colabUrl = process.env.COLAB_AI_ANALYTICS_URL;
    if (!colabUrl) {
      throw new Error('Colab AI service not configured');
    }

    const response = await fetch(`${colabUrl}/analyze-sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: textContent,
        poll_id: pollData.id,
        analysis_type: 'sentiment'
      })
    });

    if (!response.ok) {
      throw new Error(`Colab AI service error: ${response.status}`);
    }

    const result = await response.json();
    return {
      ...result,
      analysis_method: 'colab_ai',
      raw_content: textContent
    };
  } catch (error) {
    console.error('Colab AI sentiment analysis failed:', error);
    // Fallback to basic analysis
    return {
      sentiment_score: 0.5,
      emotional_tone: "neutral",
      political_sentiment: "center",
      urgency_level: "low",
      controversy_level: "low",
      key_themes: ["general"],
      confidence: 0.3,
      analysis: "Fallback analysis due to AI service unavailability",
      raw_content: textContent,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function detectBotsWithAI(pollData: any) {
  // Use our Google Colab AI service for bot detection
  console.log('🤖 Using Google Colab AI for bot detection...');
  
  const votes = pollData.poll_options.flatMap((opt: any) => opt.votes);
  const votingPatterns = analyzeVotingPatterns(votes);

  try {
    const colabUrl = process.env.COLAB_AI_ANALYTICS_URL;
    if (!colabUrl) {
      throw new Error('Colab AI service not configured');
    }

    const response = await fetch(`${colabUrl}/detect-bots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        poll_id: pollData.id,
        votes: votes.map((vote: any) => ({
          created_at: vote.created_at,
          trust_tier: vote.trust_tier,
          user_id: vote.user_id,
          voter_session: vote.voter_session
        })),
        analysis_type: 'bot_detection'
      })
    });

    if (!response.ok) {
      throw new Error(`Colab AI service error: ${response.status}`);
    }

    const result = await response.json();
    return {
      ...result,
      analysis_method: 'colab_ai',
      local_patterns: votingPatterns
    };
  } catch (error) {
    console.error('Colab AI bot detection failed:', error);
    // Fallback to basic analysis
    return {
      bot_probability: 0.1,
      suspicious_patterns: votingPatterns.suspiciousPatterns,
      coordination_score: 0.1,
      velocity_anomalies: votingPatterns.velocityAnomalies,
      ip_clustering: false,
      confidence: 0.5,
      analysis: "Fallback analysis due to AI service unavailability",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function analyzeNarrativeWithAI(pollData: any) {
  // Use our Google Colab AI service for narrative analysis
  console.log('🤖 Using Google Colab AI for narrative analysis...');
  
  const trustTierData = groupVotesByTrustTier(pollData);

  try {
    const colabUrl = process.env.COLAB_AI_ANALYTICS_URL;
    if (!colabUrl) {
      throw new Error('Colab AI service not configured');
    }

    const response = await fetch(`${colabUrl}/analyze-narrative`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        poll_id: pollData.id,
        question: pollData.question,
        options: pollData.poll_options.map((opt: any) => opt.text),
        trust_tier_data: trustTierData,
        analysis_type: 'narrative'
      })
    });

    if (!response.ok) {
      throw new Error(`Colab AI service error: ${response.status}`);
    }

    const result = await response.json();
    return {
      ...result,
      analysis_method: 'colab_ai',
      trust_tier_analysis: trustTierData
    };
  } catch (error) {
    console.error('Colab AI narrative analysis failed:', error);
    // Fallback to basic analysis
    return {
      narrative_divergence_score: 0.2,
      trust_tier_analysis: trustTierData,
      key_differences: ["engagement_level"],
      confidence: 0.4,
      analysis: "Fallback analysis due to AI service unavailability",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function detectManipulationWithAI(pollData: any) {
  // Use our Google Colab AI service for manipulation detection
  console.log('🤖 Using Google Colab AI for manipulation detection...');

  try {
    const colabUrl = process.env.COLAB_AI_ANALYTICS_URL;
    if (!colabUrl) {
      throw new Error('Colab AI service not configured');
    }

    const response = await fetch(`${colabUrl}/detect-manipulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        poll_id: pollData.id,
        question: pollData.question,
        options: pollData.poll_options.map((opt: any) => opt.text),
        votes: pollData.poll_options.flatMap((opt: any) => opt.votes).map((vote: any) => ({
          created_at: vote.created_at,
          trust_tier: vote.trust_tier,
          user_id: vote.user_id
        })),
        analysis_type: 'manipulation'
      })
    });

    if (!response.ok) {
      throw new Error(`Colab AI service error: ${response.status}`);
    }

    const result = await response.json();
    return {
      ...result,
      analysis_method: 'colab_ai'
    };
  } catch (error) {
    console.error('Colab AI manipulation detection failed:', error);
    // Fallback to basic analysis
    return {
      manipulation_probability: 0.05,
      coordination_indicators: [],
      timing_anomalies: false,
      content_manipulation: false,
      confidence: 0.6,
      analysis: "Fallback analysis due to AI service unavailability",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function analyzeVotingPatterns(votes: any[]) {
  const patterns = {
    suspiciousPatterns: [] as string[],
    velocityAnomalies: false,
    timeClustering: false
  };

  // Analyze voting velocity
  const now = new Date();
  const recentVotes = votes.filter(vote => {
    const voteTime = new Date(vote.created_at);
    return (now.getTime() - voteTime.getTime()) < 3600000; // Last hour
  });

  if (recentVotes.length > 10) {
    patterns.velocityAnomalies = true;
    patterns.suspiciousPatterns.push('high_velocity_voting');
  }

  return patterns;
}

function groupVotesByTrustTier(pollData: any) {
  const trustTierGroups = {
    tier_1: { count: 0, percentage: 0 },
    tier_2: { count: 0, percentage: 0 },
    tier_3: { count: 0, percentage: 0 },
    tier_4: { count: 0, percentage: 0 }
  };

  const allVotes = pollData.poll_options.flatMap((opt: any) => opt.votes);
  const totalVotes = allVotes.length;

  allVotes.forEach((vote: any) => {
    const tier = vote.trust_tier || 1;
    const tierKey = `tier_${tier}` as keyof typeof trustTierGroups;
    if (trustTierGroups[tierKey]) {
      trustTierGroups[tierKey].count++;
    }
  });

  // Calculate percentages
  Object.keys(trustTierGroups).forEach(key => {
    const tierKey = key as keyof typeof trustTierGroups;
    trustTierGroups[tierKey].percentage = totalVotes > 0 
      ? (trustTierGroups[tierKey].count / totalVotes) * 100 
      : 0;
  });

  return trustTierGroups;
}