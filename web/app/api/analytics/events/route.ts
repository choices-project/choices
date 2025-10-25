/**
 * @fileoverview Analytics Events API
 * 
 * Analytics events API providing event tracking, data storage,
 * and engagement metrics with validation and type safety.
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Validation schema for analytics events
 * 
 * @const {z.ZodObject} AnalyticsEventSchema
 */
const AnalyticsEventSchema = z.object({
  event_type: z.string().min(1, 'Event type is required'),
  event_data: z.record(z.string(), z.any()).optional(),
  session_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional()
});

/**
 * Track analytics events
 * 
 * @param {NextRequest} request - Request object
 * @param {string} request.body.event_type - Type of analytics event to track
 * @param {Record<string, any>} [request.body.event_data] - Detailed event data
 * @param {string} [request.body.session_id] - Session ID for session tracking
 * @param {string} [request.body.user_id] - User ID for authenticated events
 * @returns {Promise<NextResponse>} Analytics event creation result
 * 
 * @example
 * POST /api/analytics/events
 * {
 *   "event_type": "poll_created",
 *   "event_data": { "poll_id": "poll-123", "category": "politics" }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();
    
    // Validate input
    const validatedData = AnalyticsEventSchema.parse(body);
    
    // Get current user (optional for anonymous events)
    const { data: { user } } = await supabase.auth.getUser();

    // Create analytics event with sophisticated tracking
    const { data: event, error: createError } = await supabase
      .from('analytics_events')
      .insert({
        event_type: validatedData.event_type,
        user_id: validatedData.user_id || user?.id || null,
        session_id: validatedData.session_id || crypto.randomUUID(),
        event_data: validatedData.event_data || {},
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      logger.error('Error creating analytics event:', createError);
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }

    logger.info('Analytics event tracked', { 
      eventId: event.id, 
      eventType: event.event_type,
      userId: event.user_id 
    });

    return NextResponse.json({
      success: true,
      eventId: event.id,
      eventType: event.event_type,
      sessionId: event.session_id
    });

  } catch (error) {
    logger.error('Analytics events POST error:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/analytics/events - Get analytics events (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const limit = parseInt(searchParams.get('limit') || '100');
    const eventType = searchParams.get('event_type') || 'all';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('analytics_events')
      .select(`
        id,
        event_type,
        user_id,
        session_id,
        event_data,
        ip_address,
        user_agent,
        created_at,
        analytics_event_data(data_key, data_value, data_type)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (eventType !== 'all') {
      query = query.eq('event_type', eventType);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: events, error } = await query;

    if (error) {
      logger.error('Error fetching analytics events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({
      events: events || [],
      total: events?.length || 0,
      filters: { eventType, startDate, endDate }
    });

  } catch (error) {
    logger.error('Analytics events GET error:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
