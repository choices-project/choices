/**
 * Enhanced Analytics API Route
 * Showcases our comprehensive schema capabilities
 * Created: 2025-10-27
 */

import { type NextRequest, NextResponse } from 'next/server';

import { EnhancedAnalyticsService } from '@/features/analytics/lib/enhanced-analytics-service';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/enhanced - Comprehensive analytics using our new schema
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'dashboard';
    const pollId = searchParams.get('poll_id');
    const userId = searchParams.get('user_id');
    const timeRange = searchParams.get('time_range') ?? '7 days';

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Check admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    const isAdmin = profile?.is_admin ?? false;

    const analytics = new EnhancedAnalyticsService(supabase as any);

    switch (type) {
      case 'dashboard': {
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }
        
        const dashboardData = await analytics.getAnalyticsDashboard(timeRange);
        return NextResponse.json({
          success: true,
          data: dashboardData,
          type: 'dashboard'
        });
      }

      case 'poll': {
        if (!pollId) {
          return NextResponse.json(
            { error: 'Poll ID required' },
            { status: 400 }
          );
        }

        const pollAnalytics = await analytics.getComprehensivePollAnalytics(pollId, timeRange);
        return NextResponse.json({
          success: true,
          data: pollAnalytics,
          type: 'poll',
          pollId
        });
      }

      case 'trust-tier': {
        if (!pollId) {
          return NextResponse.json(
            { error: 'Poll ID required' },
            { status: 400 }
          );
        }

        const trustTier = searchParams.get('trust_tier');
        const trustAnalysis = await analytics.getTrustTierAnalysis(
          pollId, 
          trustTier ?? undefined
        );
        
        return NextResponse.json({
          success: true,
          data: trustAnalysis,
          type: 'trust-tier',
          pollId,
          trustTier: trustTier ? parseInt(trustTier) : null
        });
      }

      case 'bot-detection': {
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }

        const botAnalysis = await analytics.detectBotBehavior(pollId ?? '', userId ?? '');
        return NextResponse.json({
          success: true,
          data: botAnalysis,
          type: 'bot-detection',
          pollId,
          userId
        });
      }

      case 'system-health': {
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }

        const systemHealth = await analytics.getSystemHealthContext();
        return NextResponse.json({
          success: true,
          data: systemHealth,
          type: 'system-health'
        });
      }

      case 'site-messages': {
        const targetAudience = searchParams.get('audience') ?? 'all';
        const siteMessages = await analytics.getActiveSiteMessages(targetAudience);
        
        return NextResponse.json({
          success: true,
          data: siteMessages,
          type: 'site-messages',
          targetAudience
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Enhanced analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/enhanced - Track events and update metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const analytics = new EnhancedAnalyticsService(supabase as any);

    switch (action) {
      case 'track-session':
        await analytics.trackUserSession(data);
        return NextResponse.json({
          success: true,
          message: 'Session tracked successfully'
        });

      case 'track-feature':
        await analytics.trackFeatureUsage(data.userId, data.featureName, data.context);
        return NextResponse.json({
          success: true,
          message: 'Feature usage tracked successfully'
        });

      case 'record-metric':
        await analytics.recordPlatformMetric(data.metricName, data.dimensions);
        return NextResponse.json({
          success: true,
          message: 'Platform metric recorded successfully'
        });

      case 'update-health':
        await analytics.updateSystemHealth(data.serviceName, data.healthData);
        return NextResponse.json({
          success: true,
          message: 'System health updated successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid tracking action' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Enhanced analytics tracking error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
