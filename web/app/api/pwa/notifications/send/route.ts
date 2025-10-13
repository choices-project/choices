/**
 * PWA Push Notification Sending API
 * 
 * Handles sending push notifications to subscribed users.
 * This is typically used by admin users or automated systems.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { createApiLogger } from '@/lib/utils/api-logger';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const apiLogger = createApiLogger('/api/pwa/notifications/send', 'POST');
  
  try {
    // Check if PWA feature is enabled
    if (!isFeatureEnabled('PWA')) {
      return NextResponse.json({
        success: false,
        error: 'PWA feature is disabled'
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      message, 
      url, 
      icon, 
      badge, 
      tag, 
      data, 
      targetUsers, 
      targetType = 'all' 
    } = body;

    if (!title || !message) {
      return NextResponse.json({
        success: false,
        error: 'Title and message are required'
      }, { status: 400 });
    }

    logger.info(`PWA: Sending push notification - "${title}" to ${targetType}`);
    apiLogger.info('Sending push notification', { title, targetType, targetUsers: targetUsers?.length || 0 });

    // Get target subscriptions
    const subscriptions = await getTargetSubscriptions(targetUsers, targetType);
    
    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active subscriptions found for target audience'
      }, { status: 404 });
    }

    // Prepare notification payload
    const payload = {
      title,
      body: message,
      icon: icon || '/icons/icon-192x192.png',
      badge: badge || '/icons/icon-72x72.png',
      tag: tag || `notification_${Date.now()}`,
      data: {
        url: url || '/',
        timestamp: new Date().toISOString(),
        ...data
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/action-dismiss.png'
        }
      ],
      requireInteraction: false,
      silent: false
    };

    // Send notifications
    const results = await sendPushNotifications(subscriptions, payload);

    logger.info(`PWA: Push notification sent - ${results.successful} successful, ${results.failed} failed`);
    apiLogger.info('Push notification sent', { successful: results.successful, failed: results.failed });

    return NextResponse.json({
      success: true,
      message: 'Push notifications sent successfully',
      results: {
        total: subscriptions.length,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('PWA: Failed to send push notifications:', error instanceof Error ? error : new Error(String(error)));
    apiLogger.error('Failed to send push notifications', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send push notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if PWA feature is enabled
    if (!isFeatureEnabled('PWA')) {
      return NextResponse.json({
        success: false,
        error: 'PWA feature is disabled'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get notification history
    const history = await getNotificationHistory(userId, limit);

    return NextResponse.json({
      success: true,
      history,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('PWA: Failed to get notification history:', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get notification history',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get target subscriptions based on criteria
 */
async function getTargetSubscriptions(targetUsers?: string[], targetType: string = 'all'): Promise<any[]> {
  const supabase = await getSupabaseServerClient();
  
  logger.info('Getting subscriptions for target type', { targetType });
  
  let query = supabase
    .from('push_subscriptions')
    .select(`
      id,
      user_id,
      endpoint,
      p256dh_key,
      auth_key,
      user_notification_preferences!inner(
        push_enabled,
        poll_notifications,
        system_notifications,
        marketing_notifications
      )
    `)
    .eq('user_notification_preferences.push_enabled', true);
  
  if (targetUsers && targetUsers.length > 0) {
    query = query.in('user_id', targetUsers);
  }
  
  const { data: subscriptions, error } = await query;
  
  if (error) {
    logger.error('PWA: Failed to get target subscriptions:', error);
    return [];
  }
  
  return subscriptions.map(sub => ({
    id: sub.id,
    userId: sub.user_id,
    subscription: {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh_key,
        auth: sub.auth_key
      }
    }
  }));
}

/**
 * Send push notifications to multiple subscriptions
 */
async function sendPushNotifications(subscriptions: any[], payload: any): Promise<{
  successful: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };

  // In a real implementation, you would use a push service like FCM or web-push
  // For now, we'll simulate the sending process
  
  for (const subscription of subscriptions) {
    try {
      // Simulate sending push notification
      await simulatePushNotification(subscription, payload);
      results.successful++;
      
      // Log the notification
      await logNotification({
        subscriptionId: subscription.id,
        userId: subscription.userId,
        title: payload.title,
        message: payload.body,
        sentAt: new Date().toISOString(),
        status: 'sent'
      });
      
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to send to ${subscription.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Log the failed notification
      await logNotification({
        subscriptionId: subscription.id,
        userId: subscription.userId,
        title: payload.title,
        message: payload.body,
        sentAt: new Date().toISOString(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Simulate sending a push notification
 */
async function simulatePushNotification(subscription: any, payload: any): Promise<void> {
  // In a real implementation, this would use web-push or FCM
  // For now, we'll just log the notification
  logger.info(`PWA: Simulating push notification to ${subscription.userId}:`, {
    title: payload.title,
    message: payload.body,
    url: payload.data?.url
  });
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Log notification for tracking
 */
async function logNotification(notification: any): Promise<void> {
  const supabase = await getSupabaseServerClient();
  
  const { error } = await supabase
    .from('notification_logs')
    .insert({
      subscription_id: notification.subscriptionId,
      user_id: notification.userId,
      title: notification.title,
      message: notification.message,
      sent_at: notification.sentAt,
      status: notification.status,
      error_message: notification.error || null
    });
    
  if (error) {
    logger.error('PWA: Failed to log notification:', error);
  } else {
    logger.info('PWA: Logged notification:', notification);
  }
}

/**
 * Get notification history
 */
async function getNotificationHistory(userId?: string | null, limit: number = 10): Promise<any[]> {
  const supabase = await getSupabaseServerClient();
  
  let query = supabase
    .from('notification_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit);
    
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data: notifications, error } = await query;
  
  if (error) {
    logger.error('PWA: Failed to get notification history:', error);
    return [];
  }
  
  return notifications.map(notif => ({
    id: notif.id,
    title: notif.title,
    message: notif.message,
    sentAt: notif.sent_at,
    status: notif.status,
    userId: notif.user_id
  }));
}

  // This would typically query your database
  // For now, we'll return mock data
  return [
    {
      id: 'notif_1',
      title: 'New Poll Available',
      message: 'A new poll has been created in your area',
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'sent',
      userId: userId || 'user_1'
    },
    {
      id: 'notif_2',
      title: 'Poll Results Ready',
      message: 'Results for "Community Survey" are now available',
      sentAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'sent',
      userId: userId || 'user_1'
    }
  ].slice(0, limit);
