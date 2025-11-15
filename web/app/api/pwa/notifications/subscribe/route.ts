/**
 * PWA Push Notification Subscription API
 *
 * Handles push notification subscriptions for PWA users.
 * This enables users to receive notifications for new polls, results, etc.
 */

import type { NextRequest } from 'next/server';

import {
  withErrorHandling,
  successResponse,
  forbiddenError,
  validationError,
  errorResponse,
  notFoundError,
} from '@/lib/api';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import type { Json } from '@/types/supabase';

type SubscriptionPreferences = {
  newPolls: boolean;
  pollResults: boolean;
  systemUpdates: boolean;
  weeklyDigest: boolean;
  [key: string]: unknown;
};

const DEFAULT_PREFERENCES: SubscriptionPreferences = {
  newPolls: true,
  pollResults: true,
  systemUpdates: false,
  weeklyDigest: true
};

const normalizePreferences = (
  preferences: unknown
): SubscriptionPreferences => ({
  ...DEFAULT_PREFERENCES,
  ...(typeof preferences === 'object' && preferences !== null ? preferences : {})
});

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

  if (!userId || typeof userId !== 'string') {
    return validationError({ userId: 'User ID is required' });
  }

    logger.info(`PWA: Registering push notification subscription for user ${userId}`);

  const isValidSubscription = await validateSubscription(subscription);
  if (!isValidSubscription) {
    return validationError({ subscription: 'Invalid subscription format' });
  }

  const supabase = await getSupabaseServerClient();

  const activePreferences = normalizePreferences(preferences);
  const preferencesJson = activePreferences as unknown as Json;
  const subscriptionJson = subscription as unknown as Json;
  const subscriptionRecord = {
    endpoint: subscription.endpoint,
    subscription_data: subscriptionJson,
    auth_key: subscription.keys?.auth ?? null,
    p256dh_key: subscription.keys?.p256dh ?? null,
    user_id: userId,
    preferences: preferencesJson,
    is_active: true,
    deactivated_at: null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  const existing = await supabase
    .from('push_subscriptions')
    .select('id, created_at')
    .eq('endpoint', subscription.endpoint)
    .maybeSingle();

  if (existing.error) {
    logger.error('PWA: Failed to lookup existing push subscription', existing.error);
    return errorResponse('Failed to register subscription', 500);
  }

  let upsertResult;
  if (existing.data?.id) {
    upsertResult = await supabase
      .from('push_subscriptions')
      .update({
        ...subscriptionRecord,
        created_at: existing.data.created_at ?? subscriptionRecord.created_at
      })
      .eq('id', existing.data.id)
      .select('id')
      .single();
  } else {
    upsertResult = await supabase
      .from('push_subscriptions')
      .insert(subscriptionRecord)
      .select('id')
      .single();
  }

  if (upsertResult.error || !upsertResult.data) {
    logger.error('PWA: Failed to persist push subscription', upsertResult.error ?? {});
    return errorResponse('Failed to register subscription', 500);
  }

  logger.info(`PWA: Push notification subscription registered with ID ${upsertResult.data.id}`);

  return successResponse(
    {
      subscriptionId: upsertResult.data.id,
      message: 'Push notifications enabled successfully',
      timestamp: new Date().toISOString()
    },
    undefined,
    201
  );
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

  const removed = await removeSubscription(userId, subscriptionId);

  if (!removed) {
    return notFoundError('Subscription not found');
  }

  logger.info(`PWA: Push notification subscription removed`);

  return successResponse({
    message: 'Push notifications disabled successfully',
    timestamp: new Date().toISOString()
  });
});

export const GET = withErrorHandling(async (request: NextRequest) => {
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
  return !!(
    subscription?.endpoint &&
    typeof subscription.endpoint === 'string' &&
    subscription.keys?.p256dh &&
    subscription.keys.auth
  );
}

/**
 * Store push subscription in database
 */
async function storeSubscription(data: any): Promise<string> {
  // Deprecated helper retained for backwards compatibility.
  throw new Error('storeSubscription helper is no longer used. Use Supabase persistence directly.');
}

/**
 * Remove push subscription from database
 */
async function removeSubscription(userId?: string | null, subscriptionId?: string | null): Promise<boolean> {
  const supabase = await getSupabaseServerClient();

  const now = new Date().toISOString();

  let query = supabase
    .from('push_subscriptions')
    .update({ is_active: false, deactivated_at: now, updated_at: now })
    .eq('is_active', true);

  if (subscriptionId) {
    query = query.eq('id', subscriptionId);
  }

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.select('id');

  if (error) {
    logger.error('PWA: Failed to remove push subscription', error);
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

/**
 * Get notification preferences for user
 */
async function getNotificationPreferences(userId: string): Promise<any> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('preferences, updated_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('PWA: Failed to fetch push notification preferences', error);
    return {
      ...DEFAULT_PREFERENCES,
      lastUpdated: null
    };
  }

  if (!data) {
    return {
      ...DEFAULT_PREFERENCES,
      lastUpdated: null
    };
  }

  return {
    ...normalizePreferences(data.preferences),
    lastUpdated: data.updated_at ?? null
  };
}

/**
 * Update notification preferences for user
 */
async function updateNotificationPreferences(userId: string, preferences: any): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  const normalized = normalizePreferences(preferences);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('push_subscriptions')
    .update({
      preferences: normalized as unknown as Json,
      updated_at: now
    })
    .eq('user_id', userId)
    .eq('is_active', true)
    .select('id');

  if (error) {
    logger.error('PWA: Failed to update push notification preferences', error);
    return false;
  }

  return Boolean(data && data.length > 0);
}
