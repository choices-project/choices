/**
 * @fileoverview Notifications API
 * 
 * Notification management API providing user notifications,
 * delivery tracking, and read status management.
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
 * Validation schema for sophisticated notifications
 * 
 * Ensures proper data structure for notifications with comprehensive
 * validation for types, priorities, and metadata.
 * 
 * @const {z.ZodObject} NotificationSchema
 */
const NotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  notification_type: z.enum(['poll_created', 'poll_ended', 'vote_cast', 'civic_action', 'system', 'engagement']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  action_url: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

/**
 * Get user notifications
 * 
 * @param {NextRequest} request - Request object
 * @param {string} [request.searchParams.limit] - Number of notifications to return (default: 20)
 * @param {string} [request.searchParams.type] - Notification type filter (default: 'all')
 * @param {string} [request.searchParams.priority] - Priority level filter (default: 'all')
 * @param {boolean} [request.searchParams.unread_only] - Show only unread notifications
 * @returns {Promise<NextResponse>} Notifications data
 * 
 * @example
 * GET /api/notifications?priority=high&unread_only=true&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseInt(searchParams.get('limit') || '20');
    const notificationType = searchParams.get('type') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const unreadOnly = searchParams.get('unread_only') === 'true';

    logger.info('Fetching notifications', { 
      userId: user.id, 
      limit, 
      notificationType, 
      priority, 
      unreadOnly 
    });

    let query = supabase
      .from('notifications')
      .select(`
        id,
        title,
        message,
        notification_type,
        priority,
        action_url,
        metadata,
        is_read,
        read_at,
        created_at,
        updated_at,
        notification_delivery_logs(delivery_method, delivery_status, delivery_timestamp)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (notificationType !== 'all') {
      query = query.eq('notification_type', notificationType);
    }
    if (priority !== 'all') {
      query = query.eq('priority', priority);
    }
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      logger.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({
      notifications: notifications || [],
      total: notifications?.length || 0,
      filters: { notificationType, priority, unreadOnly }
    });

  } catch (error) {
    logger.error('Notifications GET error:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Create a new notification
 * 
 * @param {NextRequest} request - Request object
 * @param {string} request.body.title - Notification title
 * @param {string} request.body.message - Notification message
 * @param {string} request.body.notification_type - Type of notification
 * @param {string} [request.body.priority] - Priority level (default: 'normal')
 * @param {string} [request.body.action_url] - Optional action URL
 * @param {Object} [request.body.metadata] - Additional notification metadata
 * @returns {Promise<NextResponse>} Created notification data
 * 
 * @example
 * POST /api/notifications
 * {
 *   "title": "New Poll Created",
 *   "message": "A new poll has been created",
 *   "notification_type": "poll_created",
 *   "priority": "high"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();
    
    // Validate input
    const validatedData = NotificationSchema.parse(body);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create notification with sophisticated features
    const { data: notification, error: createError } = await supabase
      .from('notifications')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        title: validatedData.title,
        message: validatedData.message,
        notification_type: validatedData.notification_type,
        priority: validatedData.priority || 'normal',
        action_url: validatedData.action_url,
        metadata: validatedData.metadata || {},
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      logger.error('Error creating notification:', createError);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    // Create delivery log for tracking
    await supabase
      .from('notification_delivery_logs')
      .insert({
        notification_id: notification.id,
        delivery_method: 'in_app',
        delivery_status: 'sent',
        delivery_timestamp: new Date().toISOString(),
        retry_count: 0
      });

    // Track notification creation analytics
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'notification_created',
        user_id: user.id,
        session_id: crypto.randomUUID(),
        event_data: {
          notification_id: notification.id,
          notification_type: notification.notification_type,
          priority: notification.priority
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        created_at: new Date().toISOString()
      });

    logger.info('Notification created successfully', { 
      notificationId: notification.id, 
      userId: user.id,
      type: notification.notification_type 
    });

    return NextResponse.json({
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        notificationType: notification.notification_type,
        priority: notification.priority,
        actionUrl: notification.action_url,
        isRead: notification.is_read,
        createdAt: notification.created_at
      }
    }, { status: 201 });

  } catch (error) {
    logger.error('Notifications POST error:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications - Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();
    const { notificationId } = body;
    
    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark notification as read
    const { data: notification, error: updateError } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating notification:', updateError);
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    logger.info('Notification marked as read', { 
      notificationId: notification.id, 
      userId: user.id 
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        isRead: notification.is_read,
        readAt: notification.read_at
      }
    });

  } catch (error) {
    logger.error('Notifications PUT error:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
