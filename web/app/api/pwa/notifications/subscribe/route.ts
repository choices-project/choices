/**
 * PWA Push Notification Subscription API
 * 
 * Handles push notification subscriptions for PWA users.
 * This enables users to receive notifications for new polls, results, etc.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { createApiLogger } from '@/lib/utils/api-logger';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const apiLogger = createApiLogger('/api/pwa/notifications/subscribe', 'POST');
  
  try {
    // Check if PWA feature is enabled
    if (!isFeatureEnabled('PWA')) {
      return NextResponse.json({
        success: false,
        error: 'PWA feature is disabled'
      }, { status: 403 });
    }

    const body = await request.json();
    const { subscription, userId, preferences } = body;

    if (!subscription?.endpoint) {
      return NextResponse.json({
        success: false,
        error: 'Invalid subscription data'
      }, { status: 400 });
    }

    logger.info(`PWA: Registering push notification subscription for user ${userId}`);
    apiLogger.info('Registering push notification subscription', { userId });

    // Validate subscription
    const isValidSubscription = await validateSubscription(subscription);
    if (!isValidSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Invalid subscription format'
      }, { status: 400 });
    }

    // Store subscription in database
    const subscriptionId = await storeSubscription({
      userId,
      subscription,
      preferences: preferences || {
        newPolls: true,
        pollResults: true,
        systemUpdates: false,
        weeklyDigest: true
      },
      createdAt: new Date().toISOString(),
      isActive: true
    });

    logger.info(`PWA: Push notification subscription registered with ID ${subscriptionId}`);
    apiLogger.info('Push notification subscription registered', { subscriptionId, userId });

    return NextResponse.json({
      success: true,
      subscriptionId,
      message: 'Push notifications enabled successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('PWA: Failed to subscribe to push notifications:', error instanceof Error ? error : new Error(String(error)));
    apiLogger.error('Failed to subscribe to push notifications', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to subscribe to push notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const subscriptionId = searchParams.get('subscriptionId');

    if (!userId && !subscriptionId) {
      return NextResponse.json({
        success: false,
        error: 'Either userId or subscriptionId is required'
      }, { status: 400 });
    }

    logger.info(`PWA: Unsubscribing push notifications for user ${userId || subscriptionId}`);

    // Remove subscription from database
    const removed = await removeSubscription(userId, subscriptionId);

    if (!removed) {
      return NextResponse.json({
        success: false,
        error: 'Subscription not found'
      }, { status: 404 });
    }

    logger.info(`PWA: Push notification subscription removed`);

    return NextResponse.json({
      success: true,
      message: 'Push notifications disabled successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('PWA: Failed to unsubscribe from push notifications:', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to unsubscribe from push notifications',
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

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Get user's notification preferences
    const preferences = await getNotificationPreferences(userId);

    return NextResponse.json({
      success: true,
      userId,
      preferences,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('PWA: Failed to get notification preferences:', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get notification preferences',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if PWA feature is enabled
    if (!isFeatureEnabled('PWA')) {
      return NextResponse.json({
        success: false,
        error: 'PWA feature is disabled'
      }, { status: 403 });
    }

    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId || !preferences) {
      return NextResponse.json({
        success: false,
        error: 'User ID and preferences are required'
      }, { status: 400 });
    }

    logger.info(`PWA: Updating notification preferences for user ${userId}`);

    // Update notification preferences
    const updated = await updateNotificationPreferences(userId, preferences);

    if (!updated) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update preferences'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('PWA: Failed to update notification preferences:', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update notification preferences',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Validate push subscription
 */
async function validateSubscription(subscription: any): Promise<boolean> {
  // Basic validation of subscription object
  return !!(subscription?.endpoint && 
           typeof subscription.endpoint === 'string' &&
           subscription.keys?.p256dh &&
           subscription.keys.auth);
}

/**
 * Store push subscription in database
 */
async function storeSubscription(data: any): Promise<string> {
  const supabase = await getSupabaseServerClient();
  
  // Store subscription in push_subscriptions table
  const { data: subscription, error: subscriptionError } = await supabase
    .from('push_subscriptions')
    .insert({
      user_id: data.userId,
      endpoint: data.subscription.endpoint,
      p256dh_key: data.subscription.keys.p256dh,
      auth_key: data.subscription.keys.auth
    })
    .select('id')
    .single();
    
  if (subscriptionError) {
    logger.error('PWA: Failed to store subscription:', subscriptionError);
    throw new Error('Failed to store subscription');
  }
  
  // Store notification preferences
  const { error: preferencesError } = await supabase
    .from('user_notification_preferences')
    .upsert({
      user_id: data.userId,
      push_enabled: true,
      poll_notifications: data.preferences?.newPolls ?? true,
      system_notifications: data.preferences?.systemUpdates ?? false,
      marketing_notifications: data.preferences?.weeklyDigest ?? true
    });
    
  if (preferencesError) {
    logger.error('PWA: Failed to store notification preferences:', preferencesError);
    // Don't throw here - subscription is more important
  }
  
  logger.info(`PWA: Stored subscription ${subscription.id} for user ${data.userId}`);
  return subscription.id;
}

/**
 * Remove push subscription from database
 */
async function removeSubscription(userId?: string | null, subscriptionId?: string | null): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  
  let query = supabase.from('push_subscriptions').delete();
  
  if (subscriptionId) {
    query = query.eq('id', subscriptionId);
  } else if (userId) {
    query = query.eq('user_id', userId);
  } else {
    return false;
  }
  
  const { error } = await query;
  
  if (error) {
    logger.error('PWA: Failed to remove subscription:', error);
    return false;
  }
  
  logger.info(`PWA: Removed subscription for user ${userId || subscriptionId}`);
  return true;
}

/**
 * Get notification preferences for user
 */
async function getNotificationPreferences(userId: string): Promise<any> {
  const supabase = await getSupabaseServerClient();
  
  const { data: preferences, error } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    logger.error('PWA: Failed to get notification preferences:', error);
    // Return default preferences
    return {
      newPolls: true,
      pollResults: true,
      systemUpdates: false,
      weeklyDigest: true,
      lastUpdated: new Date().toISOString()
    };
  }
  
  return {
    newPolls: preferences.poll_notifications,
    pollResults: preferences.poll_notifications,
    systemUpdates: preferences.system_notifications,
    weeklyDigest: preferences.marketing_notifications,
    lastUpdated: preferences.updated_at
  };
}

/**
 * Update notification preferences for user
 */
async function updateNotificationPreferences(userId: string, preferences: any): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  
  const { error } = await supabase
    .from('user_notification_preferences')
    .upsert({
      user_id: userId,
      push_enabled: preferences.pushEnabled ?? true,
      poll_notifications: preferences.newPolls ?? true,
      system_notifications: preferences.systemUpdates ?? false,
      marketing_notifications: preferences.weeklyDigest ?? true,
      updated_at: new Date().toISOString()
    });
    
  if (error) {
    logger.error('PWA: Failed to update notification preferences:', error);
    return false;
  }
  
  logger.info(`PWA: Updated preferences for user ${userId}:`, preferences);
  return true;
}
