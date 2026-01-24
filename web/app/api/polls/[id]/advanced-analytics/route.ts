/**
 * Advanced Analytics API Endpoint (Rate-Limited)
 *
 * Wrapper around /api/analytics/unified/[id] that adds:
 * - Rate limiting (3 per week per user, admins unlimited)
 * - Poll status validation (closed polls only for non-admins)
 * - Usage tracking
 *
 * Uses existing /api/analytics/unified/[id] for actual analytics processing.
 *
 * Created: January 2025
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  canRunAdvancedAnalytics,
  recordAnalyticsUsage,
  type AnalyticsType,
} from '@/lib/analytics/rate-limiter';
import {
  errorResponse,
  successResponse,
  validationError,
  withErrorHandling,
} from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/polls/[id]/advanced-analytics
 *
 * Request body:
 * {
 *   "analyticsType": "demographics" | "geographic" | "trust_tier" | "temporal" | "funnel",
 *   "methods"?: string, // Optional: comma-separated methods for unified API
 *   "aiProvider"?: string, // Optional: AI provider preference
 *   "trustTiers"?: number[], // Optional: trust tier filter
 *   "analysisWindow"?: string // Optional: time window (default: "24 hours")
 * }
 */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now();

  try {
    const { id: pollId } = await params;
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return errorResponse('Database connection not available', 500);
    }

    // Get authenticated user
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return errorResponse('Authentication required', 401);
    }

    // Get user profile to check admin status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      logger.error('Failed to fetch user profile', { userId: user.id, error: profileError });
      return errorResponse('Failed to verify user permissions', 500);
    }

    const isAdmin = profile?.is_admin === true;

    // Parse request body
    let body: {
      analyticsType: AnalyticsType;
      methods?: string;
      aiProvider?: string;
      trustTiers?: number[];
      analysisWindow?: string;
    };

    try {
      body = await request.json();
    } catch {
      return validationError({ body: 'Invalid JSON in request body' });
    }

    if (!body.analyticsType) {
      return validationError({ analyticsType: 'analyticsType is required' });
    }

    // Map our analytics types to unified API methods
    const analyticsTypeToMethods: Record<AnalyticsType, string> = {
      demographics: 'trust-tier,geographic',
      geographic: 'geographic',
      trust_tier: 'trust-tier',
      temporal: 'temporal',
      funnel: 'comprehensive', // Funnel analysis uses comprehensive
    };

    // Check rate limit
    const rateLimitCheck = await canRunAdvancedAnalytics(
      user.id,
      pollId,
      body.analyticsType,
      isAdmin
    );

    if (!rateLimitCheck.allowed) {
      logger.warn('Rate limit exceeded for advanced analytics', {
        userId: user.id,
        pollId,
        analyticsType: body.analyticsType,
        isAdmin,
        reason: rateLimitCheck.reason,
      });

      return errorResponse(
        rateLimitCheck.reason || 'Rate limit exceeded',
        429,
        {
          remaining: rateLimitCheck.remaining,
          resetDate: rateLimitCheck.resetDate.toISOString(),
        }
      );
    }

    // Build URL for unified analytics API
    const methods = body.methods || analyticsTypeToMethods[body.analyticsType] || 'comprehensive';
    const aiProvider = body.aiProvider || 'rule-based'; // Default to rule-based (fastest, no AI costs)
    const trustTiers = body.trustTiers || [1, 2, 3];
    const analysisWindow = body.analysisWindow || '24 hours';

    const unifiedApiUrl = new URL(`/api/analytics/unified/${pollId}`, request.url);
    unifiedApiUrl.searchParams.set('methods', methods);
    unifiedApiUrl.searchParams.set('ai-provider', aiProvider);
    unifiedApiUrl.searchParams.set('trust-tiers', trustTiers.join(','));
    unifiedApiUrl.searchParams.set('analysis-window', analysisWindow);
    unifiedApiUrl.searchParams.set('cache', 'true'); // Enable caching

    // Call unified analytics API
    logger.info('Calling unified analytics API', {
      pollId,
      analyticsType: body.analyticsType,
      methods,
      aiProvider,
      userId: user.id,
    });

    const unifiedResponse = await fetch(unifiedApiUrl.toString(), {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
      },
    });

    if (!unifiedResponse.ok) {
      const errorData = await unifiedResponse.json().catch(() => ({ error: 'Unknown error' }));
      logger.error('Unified analytics API failed', {
        pollId,
        status: unifiedResponse.status,
        error: errorData,
      });
      return errorResponse(
        `Analytics processing failed: ${errorData.error || unifiedResponse.statusText}`,
        unifiedResponse.status
      );
    }

    const analyticsData = await unifiedResponse.json();

    // Record usage (only for non-admins)
    if (!isAdmin) {
      await recordAnalyticsUsage(user.id, pollId, body.analyticsType);
    }

    const duration = Date.now() - startTime;

    logger.info('Advanced analytics completed', {
      pollId,
      analyticsType: body.analyticsType,
      userId: user.id,
      isAdmin,
      duration,
      remaining: rateLimitCheck.remaining - 1,
    });

    return successResponse({
      success: true,
      data: analyticsData.data || analyticsData,
      analyticsType: body.analyticsType,
      remaining: rateLimitCheck.remaining - 1,
      resetDate: rateLimitCheck.resetDate.toISOString(),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Advanced analytics error', {
      error: error instanceof Error ? error : new Error(String(error)),
      duration,
    });
    return errorResponse(
      `Failed to process advanced analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
});

/**
 * GET /api/polls/[id]/advanced-analytics
 *
 * Returns rate limit status without running analytics
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: pollId } = await params;
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return errorResponse('Database connection not available', 500);
    }

    // Get authenticated user
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return errorResponse('Authentication required', 401);
    }

    // Get user profile to check admin status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    const isAdmin = profile?.is_admin === true;

    // Get analytics type from query params
    const { searchParams } = new URL(request.url);
    const analyticsType = (searchParams.get('type') || 'demographics') as AnalyticsType;

    // Check rate limit
    const rateLimitCheck = await canRunAdvancedAnalytics(
      user.id,
      pollId,
      analyticsType,
      isAdmin
    );

    return successResponse({
      allowed: rateLimitCheck.allowed,
      remaining: rateLimitCheck.remaining,
      resetDate: rateLimitCheck.resetDate.toISOString(),
      isAdmin,
      reason: rateLimitCheck.reason,
    });
  } catch (error) {
    logger.error('Failed to get rate limit status', { error });
    return errorResponse('Failed to get rate limit status', 500);
  }
});
