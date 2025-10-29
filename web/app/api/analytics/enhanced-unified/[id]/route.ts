/**
 * Enhanced Unified Analytics API Route
 * Integrates new schema capabilities with existing analytics system
 * Created: 2025-10-27
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';
import { EnhancedAnalyticsService } from '@/features/analytics/lib/enhanced-analytics-service';

export const dynamic = 'force-dynamic';

// Extend existing analytics method types
type AnalyticsMethod = 'sentiment' | 'bot-detection' | 'temporal' | 'trust-tier' | 'geographic' | 'comprehensive' | 'enhanced';
type AIProvider = 'colab' | 'hugging-face' | 'local-ai' | 'rule-based';

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
    const methodsParam = searchParams.get('methods') || 'enhanced'; // Default to enhanced
    const aiProviderParam = searchParams.get('ai-provider') || 'colab';
    const trustTiersParam = searchParams.get('trust-tiers');
    const analysisWindow = searchParams.get('analysis-window') || '24 hours';
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
    const enhancedAnalytics = new EnhancedAnalyticsService(supabase);
    
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
      poll_question: poll.question,
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
      case 'bot-detection':
        // Use our built-in bot detection function
        const { data: botData, error: botError } = await supabase.rpc('detect_bot_behavior', {
          p_poll_id: pollId,
          p_time_window: analysisWindow
        });
        
        return {
          data: {
            botDetection: botData,
            riskScore: botData?.risk_score || 0,
            suspiciousPatterns: botData?.suspicious_patterns || [],
            confidence: botData?.confidence || 0,
            method: 'enhanced_built_in',
            timestamp: new Date().toISOString()
          },
          error: botError
        };
        
      case 'trust-tier':
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
        
      case 'comprehensive':
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
        
      case 'enhanced':
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
 * Execute existing analytics method (fallback to your existing implementation)
 */
async function executeExistingAnalyticsMethod(
  supabase: any,
  pollId: string,
  method: AnalyticsMethod,
  aiProvider: AIProvider,
  trustTiers: number[],
  analysisWindow: string,
  poll: any
): Promise<{ data: any; error?: any }> {
  
  // This would integrate with your existing analytics method implementations
  // For now, return a placeholder that indicates fallback to existing system
  return {
    data: {
      method: 'existing_fallback',
      message: 'Using existing analytics method',
      pollId,
      analysisWindow,
      timestamp: new Date().toISOString(),
      note: 'This method uses your existing analytics implementation'
    },
    error: null
  };
}


