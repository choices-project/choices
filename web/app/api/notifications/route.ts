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

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';



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

    const limit = parseInt(searchParams.get('limit') ?? '20');
    const notificationType = searchParams.get('type') ?? 'all';
    const priority = searchParams.get('priority') ?? 'all';
    const unreadOnly = searchParams.get('unread_only') === 'true';

    logger.info('Fetching notifications', { 
      userId: user.id, 
      limit, 
      notificationType, 
      priority, 
      unreadOnly 
    });

    // Query notification_log (actual table schema)
    const { data: notifications, error } = await supabase
      .from('notification_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({
      notifications: notifications || [],
      total: notifications?.length || 0
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

    // Create notification using actual notification_log schema
    const { data: notification, error: createError } = await supabase
      .from('notification_log')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        body: validatedData.message,
        payload: validatedData.metadata ?? {},
        status: 'sent'
      })
      .select()
      .single();

    if (createError) {
      logger.error('Error creating notification:', createError);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    logger.info('Notification created successfully', { 
      notificationId: notification.id, 
      userId: user.id
    });

    return NextResponse.json({
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.body,
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

    // Mark notification as read in notification_log
    const { data: notification, error: updateError } = await supabase
      .from('notification_log')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
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
        readAt: notification.read_at
      }
    });

  } catch (error) {
    logger.error('Notifications PUT error:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
