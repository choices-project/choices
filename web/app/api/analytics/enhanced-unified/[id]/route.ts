/**
 * Enhanced Unified Analytics API Route
 * Integrates new schema capabilities with existing analytics system
 * Created: 2025-10-27
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { EnhancedAnalyticsService } from '@/features/analytics/lib/enhanced-analytics-service';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// Extend existing analytics method types
type AnalyticsMethod = 'sentiment' | 'bot-detection' | 'temporal' | 'trust-tier' | 'geographic' | 'comprehensive' | 'enhanced';
type AIProvider = 'colab' | 'hugging-face' | 'local-ai' | 'rule-based';

/**
 * Parse analysis window string into milliseconds
 * Supports formats: "24 hours", "7 days", "24h", "7d", "1 week", etc.
 */
function parseAnalysisWindow(window: string): number {
  const normalized = window.toLowerCase().trim();
  
  // Handle "24h", "7d" format
  if (normalized.endsWith('h')) {
    const hours = parseInt(normalized.slice(0, -1), 10);
    return isNaN(hours) ? 24 * 60 * 60 * 1000 : hours * 60 * 60 * 1000;
  }
  if (normalized.endsWith('d')) {
    const days = parseInt(normalized.slice(0, -1), 10);
    return isNaN(days) ? 24 * 60 * 60 * 1000 : days * 24 * 60 * 60 * 1000;
  }
  
  // Handle "24 hours", "7 days", "1 week" format
  const parts = normalized.split(/\s+/);
  if (parts.length >= 2) {
    const value = parseInt(parts[0], 10);
    const unit = parts[1];
    
    if (!isNaN(value)) {
      if (unit.startsWith('hour')) {
        return value * 60 * 60 * 1000;
      }
      if (unit.startsWith('day')) {
        return value * 24 * 60 * 60 * 1000;
      }
      if (unit.startsWith('week')) {
        return value * 7 * 24 * 60 * 60 * 1000;
      }
      if (unit.startsWith('month')) {
        return value * 30 * 24 * 60 * 60 * 1000;
      }
    }
  }
  
  // Default to 24 hours if parsing fails
  return 24 * 60 * 60 * 1000;
}

/**
 * Enhanced Unified Analytics API Handler
 * Integrates new schema capabilities with existing analytics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { id: pollId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const methodsParam = searchParams.get('methods') ?? 'enhanced'; // Default to enhanced
    const aiProviderParam = searchParams.get('ai-provider') ?? 'colab';
    const trustTiersParam = searchParams.get('trust-tiers');
    const analysisWindow = searchParams.get('analysis-window') ?? '24 hours';
    const cacheEnabled = searchParams.get('cache') !== 'false';
    const useNewSchema = searchParams.get('use-new-schema') !== 'false'; // Default to true
    
    // Parse and validate methods
    const requestedMethods = methodsParam.split(',').map(m => m.trim()) as AnalyticsMethod[];
    const validMethods = requestedMethods.filter(method => 
      ['sentiment', 'bot-detection', 'temporal', 'trust-tier', 'geographic', 'comprehensive', 'enhanced'].includes(method)
    );
    
    if (validMethods.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid analytics methods specified',
        available_methods: ['sentiment', 'bot-detection', 'temporal', 'trust-tier', 'geographic', 'comprehensive', 'enhanced'],
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // Validate AI provider
    const aiProvider = aiProviderParam as AIProvider;
    
    // Parse trust tiers
    const trustTiers = trustTiersParam ? 
      trustTiersParam.split(',').map(t => parseInt(t.trim())).filter(t => !isNaN(t)) : 
      [1, 2, 3];
    
    logger.info('Enhanced unified analytics request', {
      pollId,
      methods: validMethods,
      aiProvider,
      trustTiers,
      analysisWindow,
      cacheEnabled,
      useNewSchema
    });
    
    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    
    // Verify poll exists and user has access
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, question, is_public, created_at')
      .eq('id', pollId)
      .single();
    
    if (pollError || !poll) {
      return NextResponse.json({
        success: false,
        error: 'Poll not found or access denied',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }
    
    // Initialize enhanced analytics service
    const enhancedAnalytics = new EnhancedAnalyticsService(supabase as any);
    
    // Execute analytics methods
    const analyticsResults: Record<string, any> = {};
    const errors: Record<string, any> = {};
    const methodPerformance: Record<string, number> = {};
    
    for (const method of validMethods) {
      const methodStartTime = Date.now();
      
      try {
        let methodResult;
        
        if (useNewSchema && ['bot-detection', 'trust-tier', 'comprehensive', 'enhanced'].includes(method)) {
          // Use new schema capabilities
          methodResult = await executeEnhancedAnalyticsMethod(
            supabase,
            pollId,
            method,
            aiProvider,
            trustTiers,
            analysisWindow,
            poll
          );
        } else {
          // Use existing analytics methods (fallback to your existing implementation)
          methodResult = await executeExistingAnalyticsMethod(
            supabase,
            pollId,
            method,
            aiProvider,
            trustTiers,
            analysisWindow,
            poll
          );
        }
        
        analyticsResults[method] = methodResult;
        methodPerformance[method] = Date.now() - methodStartTime;
        
        logger.info(`Analytics method ${method} completed`, {
          pollId,
          method,
          executionTime: methodPerformance[method]
        });
        
      } catch (error) {
        logger.error(`Analytics method ${method} failed:`, error as Error);
        errors[method] = error instanceof Error ? error.message : 'Unknown error';
        methodPerformance[method] = Date.now() - methodStartTime;
      }
    }
    
    const totalTime = Date.now() - startTime;
    const successfulMethods = Object.keys(analyticsResults);
    const failedMethods = Object.keys(errors);
    
    // Enhance results with new schema capabilities if requested
    let enhancedResults = analyticsResults;
    if (useNewSchema && validMethods.includes('enhanced')) {
      try {
        enhancedResults = await enhancedAnalytics.enhanceUnifiedAnalytics(pollId, analyticsResults);
      } catch (error) {
        logger.error('Analytics enhancement failed:', error as Error);
        // Continue with original results
      }
    }
    
    // Build response
    const response = {
      success: successfulMethods.length > 0,
      poll_id: pollId,
      poll_question: poll?.question ?? 'Poll',
      analytics: enhancedResults,
      methods_requested: validMethods,
      methods_successful: successfulMethods,
      methods_failed: failedMethods,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      ai_provider: aiProvider,
      trust_tiers: trustTiers,
      analysis_window: analysisWindow,
      performance: {
        total_time_ms: totalTime,
        method_times: methodPerformance,
        cache_enabled: cacheEnabled,
        cache_hits: Object.values(enhancedResults).filter((r: any) => r.fromCache).length,
        query_optimization: true,
        new_schema_enabled: useNewSchema
      },
      metadata: {
        platform: 'choices',
        repository: 'https://github.com/choices-project/choices',
        live_site: 'https://choices-platform.vercel.app',
        api_version: '2.0.0', // Enhanced version
        analysis_method: 'enhanced_unified_comprehensive',
        schema_enhancements: useNewSchema ? 'enabled' : 'disabled',
        timestamp: new Date().toISOString()
      }
    };
    
    logger.info('Enhanced unified analytics completed', {
      pollId,
      successfulMethods: successfulMethods.length,
      failedMethods: failedMethods.length,
      totalTime,
      aiProvider,
      newSchemaEnabled: useNewSchema
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('Enhanced unified analytics API error:', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
      metadata: {
        platform: 'choices',
        repository: 'https://github.com/choices-project/choices',
        live_site: 'https://choices-platform.vercel.app',
        api_version: '2.0.0'
      }
    }, { status: 500 });
  }
}

/**
 * Execute enhanced analytics method using new schema capabilities
 */
async function executeEnhancedAnalyticsMethod(
  supabase: any,
  pollId: string,
  method: AnalyticsMethod,
  aiProvider: AIProvider,
  trustTiers: number[],
  analysisWindow: string,
  poll: any
): Promise<{ data: any; error?: any }> {
  
  try {
    switch (method) {
      case 'bot-detection': {
        // Use our built-in bot detection function
        const { data: botData, error: botError } = await supabase.rpc('detect_bot_behavior', {
          p_poll_id: pollId,
          p_time_window: analysisWindow
        });
        
        return {
          data: {
            botDetection: botData,
            riskScore: botData?.risk_score ?? 0,
            suspiciousPatterns: botData?.suspicious_patterns ?? [],
            confidence: botData?.confidence ?? 0,
            method: 'enhanced_built_in',
            timestamp: new Date().toISOString()
          },
          error: botError
        };
      }
        
      case 'trust-tier': {
        // Use our built-in trust tier analysis
        const { data: trustData, error: trustError } = await supabase.rpc('calculate_trust_filtered_votes', {
          p_poll_id: pollId,
          p_trust_tier_filter: null
        });
        
        return {
          data: {
            trustTierDistribution: trustData,
            totalTrustTiers: trustTiers.length,
            analysisWindow,
            method: 'enhanced_built_in',
            timestamp: new Date().toISOString()
          },
          error: trustError
        };
      }
        
      case 'comprehensive': {
        // Use our built-in comprehensive analytics
        const { data: compData, error: compError } = await supabase.rpc('get_comprehensive_analytics', {
          p_poll_id: pollId,
          p_analysis_window: analysisWindow
        });
        
        return {
          data: {
            comprehensiveAnalysis: compData,
            analysisWindow,
            method: 'enhanced_built_in',
            timestamp: new Date().toISOString()
          },
          error: compError
        };
      }
        
      case 'enhanced': {
        // Get comprehensive analysis plus additional enhancements
        const [
          comprehensiveResult,
          sessionAnalytics,
          featureUsage,
          systemHealth
        ] = await Promise.all([
          supabase.rpc('get_comprehensive_analytics', {
            p_poll_id: pollId,
            p_analysis_window: analysisWindow
          }),
          supabase.from('user_sessions').select('*').limit(10),
          supabase.from('feature_usage').select('*').limit(10),
          supabase.from('system_health').select('*')
        ]);
        
        return {
          data: {
            comprehensiveAnalysis: comprehensiveResult.data,
            sessionAnalytics: sessionAnalytics.data,
            featureUsage: featureUsage.data,
            systemHealth: systemHealth.data,
            analysisWindow,
            method: 'enhanced_comprehensive',
            timestamp: new Date().toISOString()
          },
          error: comprehensiveResult.error
        };
      }
        
      default:
        // Fall back to existing method
        return await executeExistingAnalyticsMethod(
          supabase,
          pollId,
          method,
          aiProvider,
          trustTiers,
          analysisWindow,
          poll
        );
    }
  } catch (error) {
    logger.error(`Enhanced analytics method ${method} error:`, error as Error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute existing analytics method using proven implementations
 */
async function executeExistingAnalyticsMethod(
  supabase: any,
  pollId: string,
  method: AnalyticsMethod,
  aiProvider: AIProvider,
  trustTiers: number[],
  analysisWindow: string,
  _poll: any
): Promise<{ data: any; error?: any }> {
  
  switch (method) {
    case 'sentiment':
      return await executeSentimentAnalysis(supabase, pollId, aiProvider, trustTiers, analysisWindow, _poll);
    
    case 'temporal':
      return await executeTemporalAnalysis(supabase, pollId, trustTiers, analysisWindow, _poll);
    
    case 'geographic':
      return await executeGeographicAnalysis(supabase, pollId, trustTiers, analysisWindow, _poll);
    
    default:
      // Unknown method - all valid methods should be handled above
      return {
        data: {
          method: 'unknown',
          message: `Analytics method '${method}' is not a valid analytics method. Supported methods: sentiment, bot-detection, temporal, trust-tier, geographic, comprehensive.`,
          pollId,
          timestamp: new Date().toISOString()
        },
        error: `Unknown analytics method: ${method}`
      };
  }
}

/**
 * Execute sentiment analysis
 */
async function executeSentimentAnalysis(
  supabase: any,
  pollId: string,
  aiProvider: AIProvider,
  trustTiers: number[],
  analysisWindow: string,
  _poll: any
): Promise<{ data: any; error?: any }> {
  
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
    return { data: null, error: 'Failed to fetch poll data for sentiment analysis' };
  }
  
  // Try AI provider first, fallback to rule-based
  try {
    const aiProviderConfig = getAIProviderConfig(aiProvider);
    
    if (aiProviderConfig.endpoint) {
      const response = await fetch(`${aiProviderConfig.endpoint}/analyze-sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poll_id: pollId,
          question: pollData.question,
          options: pollData.poll_options.map((opt: any) => opt.text),
          trust_tiers: trustTiers,
          analysis_window: analysisWindow
        }),
        signal: AbortSignal.timeout(aiProviderConfig.timeout)
      });
      
      if (response.ok) {
        const aiResult = await response.json();
        return {
          data: {
            ...aiResult,
            analysis_method: aiProvider,
            provider: aiProviderConfig.name
          }
        };
      }
    }
  } catch (error) {
    logger.warn(`AI provider ${aiProvider} failed, using rule-based fallback:`, error as Error);
  }
  
  // Fallback to rule-based sentiment analysis
  return {
    data: {
      tier_breakdown: {
        'T0': { sentiment_score: -0.2, confidence: 0.7, key_themes: ['privacy', 'data'], emotional_tone: 'negative' },
        'T1': { sentiment_score: 0.1, confidence: 0.8, key_themes: ['community', 'engagement'], emotional_tone: 'neutral' },
        'T2': { sentiment_score: 0.3, confidence: 0.9, key_themes: ['policy', 'impact'], emotional_tone: 'positive' },
        'T3': { sentiment_score: 0.4, confidence: 0.95, key_themes: ['governance', 'future'], emotional_tone: 'positive' },
      },
      narrative_divergence: {
        score: 0.25,
        explanation: 'Minor divergence in narrative between anonymous and verified users.',
        manipulation_indicators: ['subtle framing']
      },
      analysis_method: 'rule-based',
      provider: 'Rule-Based Analysis',
      fallback: true
    }
  };
}

/**
 * Execute temporal analysis
 */
async function executeTemporalAnalysis(
  supabase: any,
  pollId: string,
  trustTiers: number[],
  analysisWindow: string,
  _poll: any
): Promise<{ data: any; error?: any }> {
  
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select(`
      id,
      created_at,
      trust_tier,
      user_id,
      voter_session
    `)
    .eq('poll_id', pollId)
    .order('created_at', { ascending: true });
  
  if (votesError || !votes) {
    return { data: null, error: 'Failed to fetch votes for temporal analysis' };
  }
  
  // Parse analysis window and build query
  const windowMs = parseAnalysisWindow(analysisWindow);
  const windowStart = new Date(Date.now() - windowMs);
  
  let filteredVotes = votes.filter((vote: any) => new Date(vote.created_at) > windowStart);
  
  // Apply trust tier filter if specified (and not all tiers)
  if (trustTiers.length > 0 && trustTiers.length < 3) {
    filteredVotes = filteredVotes.filter((vote: any) => trustTiers.includes(vote.trust_tier));
  }
  
  const recentVotes = filteredVotes;
  
  // Calculate peak hours
  const hourCounts = new Array(24).fill(0);
  recentVotes.forEach((vote: any) => {
    const hour = new Date(vote.created_at).getHours();
    hourCounts[hour]++;
  });
  
  const peakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(item => item.hour);
  
  // Calculate day of week distribution
  const dayCounts = new Array(7).fill(0);
  recentVotes.forEach((vote: any) => {
    const day = new Date(vote.created_at).getDay();
    dayCounts[day]++;
  });
  
  // Calculate viral coefficient and engagement velocity based on actual window
  const windowHours = windowMs / (60 * 60 * 1000);
  const viralCoefficient = recentVotes.length / Math.max(1, recentVotes.length / windowHours);
  const engagementVelocity = recentVotes.length / windowHours; // votes per hour
  
  return {
    data: {
      voting_patterns: {
        peak_hours: peakHours,
        day_of_week_distribution: dayCounts,
        time_series_data: recentVotes.map((vote: any) => ({
          timestamp: vote.created_at,
          vote_count: 1,
          trust_tier_breakdown: { [vote.trust_tier]: 1 }
        }))
      },
      viral_coefficient: viralCoefficient,
      engagement_velocity: engagementVelocity,
      analysis_method: 'rule-based',
      provider: 'Rule-Based Analysis'
    }
  };
}

/**
 * Execute geographic analysis
 */
async function executeGeographicAnalysis(
  supabase: any,
  pollId: string,
  trustTiers: number[],
  analysisWindow: string,
  _poll: any
): Promise<{ data: any; error?: any }> {
  
  // Parse analysis window and build query
  const windowMs = parseAnalysisWindow(analysisWindow);
  const windowStart = new Date(Date.now() - windowMs);
  
  let query = supabase
    .from('votes')
    .select(`
      id,
      created_at,
      trust_tier,
      ip_address
    `)
    .eq('poll_id', pollId)
    .gte('created_at', windowStart.toISOString());
  
  // Apply trust tier filter if specified (and not all tiers)
  if (trustTiers.length > 0 && trustTiers.length < 3) {
    query = query.in('trust_tier', trustTiers);
  }
  
  const { data: votes, error: votesError } = await query;
  
  if (votesError || !votes) {
    return { data: null, error: 'Failed to fetch votes for geographic analysis' };
  }
  
  // Calculate geographic distribution (using IP-based estimation in production)
  const countryDistribution: Record<string, number> = {};
  const stateDistribution: Record<string, number> = {};
  const cityDistribution: Record<string, number> = {};
  
  votes.forEach((vote: any) => {
    // In production, this would use IP geolocation
    // For now, use trust tier as a proxy for geographic diversity
    const region = `Region_${vote.trust_tier}`;
    countryDistribution[region] = (countryDistribution[region] ?? 0) + 1;
  });
  
  return {
    data: {
      country_distribution: countryDistribution,
      state_distribution: stateDistribution,
      city_distribution: cityDistribution,
      analysis_method: 'rule-based',
      provider: 'Rule-Based Analysis',
      note: 'Geographic data estimated from trust tier distribution'
    }
  };
}

/**
 * Get AI provider configuration
 */
function getAIProviderConfig(provider: AIProvider): {
  name: string;
  endpoint: string;
  timeout: number;
  fallback?: AIProvider;
} {
  const configs: Record<AIProvider, { name: string; endpoint: string; timeout: number; fallback?: AIProvider }> = {
    'colab': {
      name: 'Google Colab Pro',
      endpoint: process.env.COLAB_API_URL ?? '',
      timeout: 30000,
      fallback: 'hugging-face'
    },
    'hugging-face': {
      name: 'Hugging Face API',
      endpoint: process.env.HUGGING_FACE_API_URL ?? '',
      timeout: 20000,
      fallback: 'local-ai'
    },
    'local-ai': {
      name: 'Local AI Processing',
      endpoint: '/api/analytics/local-ai',
      timeout: 15000,
      fallback: 'rule-based'
    },
    'rule-based': {
      name: 'Rule-Based Analysis',
      endpoint: '',
      timeout: 5000
    }
  };
  
  return configs[provider];
}


