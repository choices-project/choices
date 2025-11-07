/**
 * PWA Push Notification Subscription API
 * 
 * Handles push notification subscriptions for PWA users.
 * This enables users to receive notifications for new polls, results, etc.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withErrorHandling, successResponse, forbiddenError, validationError, errorResponse } from '@/lib/api';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('PWA')) {
    return forbiddenError('PWA feature is disabled');
  }

  const body = await request.json();
  const { subscription, userId, preferences } = body;

  if (!subscription?.endpoint) {
    return validationError({ subscription: 'Invalid subscription data' });
  }

    logger.info(`PWA: Registering push notification subscription for user ${userId}`);

  const isValidSubscription = await validateSubscription(subscription);
  if (!isValidSubscription) {
    return validationError({ subscription: 'Invalid subscription format' });
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

  return successResponse({
    subscriptionId,
    message: 'Push notifications enabled successfully',
    timestamp: new Date().toISOString()
  }, undefined, 201);
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('PWA')) {
    return forbiddenError('PWA feature is disabled');
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const subscriptionId = searchParams.get('subscriptionId');

  if (!userId && !subscriptionId) {
    return validationError({ 
      userId: 'Either userId or subscriptionId is required',
      subscriptionId: 'Either userId or subscriptionId is required'
    });
  }

    logger.info(`PWA: Unsubscribing push notifications for user ${userId ?? subscriptionId}`);

    // Remove subscription from database
    const removed = await removeSubscription(userId, subscriptionId);

    if (!removed) {
      return NextResponse.json({
        success: false,
        error: 'Subscription not found'
      }, { status: 404 });
    }

    logger.info(`PWA: Push notification subscription removed`);

  return successResponse({
    message: 'Push notifications disabled successfully',
    timestamp: new Date().toISOString()
  });
});

export const GET2 = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('PWA')) {
    return forbiddenError('PWA feature is disabled');
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return validationError({ userId: 'User ID is required' });
  }

  const preferences = await getNotificationPreferences(userId);

  return successResponse({
    userId,
    preferences,
    timestamp: new Date().toISOString()
  });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('PWA')) {
    return forbiddenError('PWA feature is disabled');
  }

  const body = await request.json();
  const { userId, preferences } = body;

  if (!userId || !preferences) {
    return validationError({
      userId: !userId ? 'User ID is required' : '',
      preferences: !preferences ? 'Preferences are required' : ''
    });
  }

  logger.info(`PWA: Updating notification preferences for user ${userId}`);

  const updated = await updateNotificationPreferences(userId, preferences);

  if (!updated) {
    return errorResponse('Failed to update preferences', 500);
  }

  return successResponse({
    message: 'Notification preferences updated successfully',
    timestamp: new Date().toISOString()
  });
});

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
  // This would typically store in your database
  // For now, we'll return a mock subscription ID
  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info(`PWA: Storing subscription ${subscriptionId} for user ${data.userId}`);
  
  return subscriptionId;
}

/**
 * Remove push subscription from database
 */
async function removeSubscription(userId?: string | null, subscriptionId?: string | null): Promise<boolean> {
  // This would typically remove from your database
  logger.info(`PWA: Removing subscription for user ${userId ?? subscriptionId}`);
  
  return true;
}

/**
 * Get notification preferences for user
 */
async function getNotificationPreferences(userId: string): Promise<any> {
  // This would typically query your database
  logger.debug('Getting notification preferences for user', { userId });
  return {
    newPolls: true,
    pollResults: true,
    systemUpdates: false,
    weeklyDigest: true,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Update notification preferences for user
 */
async function updateNotificationPreferences(userId: string, preferences: any): Promise<boolean> {
  // This would typically update your database
  logger.info(`PWA: Updating preferences for user ${userId}:`, preferences);
  
  return true;
}
