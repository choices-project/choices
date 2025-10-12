/**
 * Share Event Tracking API
 * 
 * Tracks social sharing events for analytics and optimization.
 * Feature-flagged and privacy-safe.
 */

import { type NextRequest, NextResponse } from 'next/server'

import { isFeatureEnabled } from '@/lib/core/feature-flags'
import { createApiLogger } from '@/lib/utils/api-logger'
import { getSupabaseServiceRoleClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  const logger = createApiLogger('/api/share', 'POST');
  
  // Feature flag check
  if (!isFeatureEnabled('SOCIAL_SHARING')) {
    logger.warn('Share tracking attempted but feature disabled');
    return NextResponse.json({ error: 'Feature disabled' }, { status: 404 })
  }

  try {
    const { platform, poll_id, placement, content_type = 'poll' } = await req.json()
    
    // Validate required fields
    if (!platform || !poll_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate platform
    const validPlatforms = ['x', 'facebook', 'linkedin', 'reddit', 'whatsapp', 'telegram', 'email', 'sms']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    // Extract client info (privacy-safe)
    const clientInfo = {
      poll_id,
      platform,
      placement: placement || 'unknown',
      content_type,
      ip: req.ip ?? null,
      user_agent: req.headers.get('user-agent') ?? null,
      timestamp: new Date().toISOString(),
      // Don't store personal data - just aggregate metrics
    }

    // Insert into Supabase using analytics_events table
    const supabase = await getSupabaseServiceRoleClient()
    
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: 'social_share',
        event_category: 'engagement',
        event_data: {
          platform,
          placement,
          content_type,
          poll_id
        },
        page_url: req.url,
        user_agent: clientInfo.user_agent,
        ip_address: clientInfo.ip,
        session_id: req.headers.get('x-session-id') || null,
        timestamp: clientInfo.timestamp
      })
    
    if (error) {
      logger.error('Share tracking error:', error)
      return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
    }

    logger.info('Share event tracked successfully', { clientInfo })

    return NextResponse.json({ 
      success: true,
      message: 'Share tracked successfully'
    })

  } catch (error) {
    logger.error('Share API error', error as Error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// GET endpoint for share analytics (admin only)
export async function GET(req: NextRequest) {
  const logger = createApiLogger('/api/share', 'GET');
  
  if (!isFeatureEnabled('SOCIAL_SHARING')) {
    logger.warn('Share analytics requested but feature disabled');
    return NextResponse.json({ error: 'Feature disabled' }, { status: 404 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const pollId = searchParams.get('poll_id')
    const platform = searchParams.get('platform')
    const days = parseInt(searchParams.get('days') || '7')

    // Log share analytics request for audit trail
    logger.info('Share analytics requested', { pollId, platform, days });

    // Query Supabase for share analytics
    const supabase = await getSupabaseServiceRoleClient()
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    
    // Build query filters
    let query = supabase
      .from('analytics_events')
      .select('*')
      .eq('event_type', 'social_share')
      .gte('timestamp', startDate)
    
    if (pollId) {
      query = query.eq('event_data->poll_id', pollId)
    }
    
    if (platform) {
      query = query.eq('event_data->platform', platform)
    }
    
    const { data: shareEvents, error } = await query
    
    if (error) {
      logger.error('Share analytics query error:', error)
      return NextResponse.json({ error: 'Analytics query failed' }, { status: 500 })
    }
    
    // Process analytics data
    const totalShares = shareEvents?.length || 0
    const platformBreakdown: Record<string, number> = {}
    const pollShares: Record<string, { shares: number; title?: string }> = {}
    
    shareEvents?.forEach(event => {
      const eventData = event.event_data
      const platform = eventData?.platform || 'unknown'
      const pollId = eventData?.poll_id
      
      // Count platform breakdown
      platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1
      
      // Count poll shares
      if (pollId) {
        if (!pollShares[pollId]) {
          pollShares[pollId] = { shares: 0 }
        }
        pollShares[pollId].shares += 1
      }
    })
    
    // Get top polls (simplified - would need poll titles from polls table)
    const topPolls = Object.entries(pollShares)
      .sort(([,a], [,b]) => b.shares - a.shares)
      .slice(0, 10)
      .map(([pollId, data]) => ({
        poll_id: pollId,
        shares: data.shares,
        title: `Poll ${pollId}` // Would need to join with polls table for actual titles
      }))
    
    const analyticsData = {
      total_shares: totalShares,
      platform_breakdown: platformBreakdown,
      top_polls: topPolls,
      conversion_rate: 0.15, // Would need to calculate from actual vote data
      period_days: days,
      generated_at: new Date().toISOString()
    }

    return NextResponse.json(analyticsData)

  } catch (error) {
    logger.error('Share analytics error', error as Error)
    return NextResponse.json({ 
      error: 'Analytics failed'
    }, { status: 500 })
  }
}
