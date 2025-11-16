/**
 * PWA Push Notification Sending API
 *
 * Handles sending push notifications to subscribed users.
 * This is typically used by admin users or automated systems.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import webPush from 'web-push';

import {
  withErrorHandling,
  successResponse,
  forbiddenError,
  validationError,
  notFoundError,
  errorResponse
} from '@/lib/api';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';
import type { Database, Json } from '@/types/supabase';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { stripUndefinedDeep } from '@/lib/util/clean';

export const dynamic = 'force-dynamic';

const VAPID_PUBLIC_KEY =
  process.env.WEB_PUSH_VAPID_PUBLIC_KEY ??
  process.env.VAPID_PUBLIC_KEY ??
  '';

const VAPID_PRIVATE_KEY =
  process.env.WEB_PUSH_VAPID_PRIVATE_KEY ??
  process.env.VAPID_PRIVATE_KEY ??
  '';

const VAPID_SUBJECT =
  process.env.WEB_PUSH_VAPID_SUBJECT ??
  process.env.VAPID_CONTACT_EMAIL ??
  'mailto:support@choices.dev';

let webPushConfigured = false;

const ensureWebPushConfigured = () => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('PWA push notifications are not configured');
  }

  if (!webPushConfigured) {
    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    webPushConfigured = true;
  }
};

const buildpayload = (
  title: string,
  message: string,
  url?: string,
  icon?: string,
  badge?: string,
  tag?: string,
  data?: Record<string, unknown>
) => ({
  title,
  body: message,
  icon: icon ?? '/icons/icon-192x192.png',
  badge: badge ?? '/icons/icon-72x72.png',
  tag: tag ?? `notification_${Date.now()}`,
  data: {
    url: url ?? '/',
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
});

type PushSubscriptionRow = Database['public']['Tables']['push_subscriptions']['Row'];

type SendResult = {
  successful: number;
  failed: number;
  errors: string[];
};

type LogStatus = 'sent' | 'failed';

type NotificationPayload = ReturnType<typeof buildpayload>;

const mapToWebPushSubscription = (record: PushSubscriptionRow) => {
  const raw = record.subscription_data as unknown as {
    endpoint?: string;
    keys?: { auth?: string; p256dh?: string };
  } | null;

  const endpoint = raw?.endpoint ?? record.endpoint;
  const auth = raw?.keys?.auth ?? record.auth_key ?? undefined;
  const p256dh = raw?.keys?.p256dh ?? record.p256dh_key ?? undefined;

  if (!endpoint || !auth || !p256dh) {
    return null;
  }

  return {
    endpoint,
    keys: {
      auth,
      p256dh
    }
  } satisfies webPush.PushSubscription;
};

const deactivateSubscription = async (supabase: SupabaseClient<Database>, id: string) => {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false, deactivated_at: now, updated_at: now })
    .eq('id', id);

  if (error) {
    logger.warn('PWA: Failed to deactivate subscription', { id, error });
  }
};

const logNotification = async (
  supabase: SupabaseClient<Database>,
  record: PushSubscriptionRow,
  payload: NotificationPayload,
  status: LogStatus,
  errorMessage?: string
) => {
  const now = new Date().toISOString();
  const entry = {
    subscription_id: record.id,
    user_id: record.user_id,
    title: payload.title,
    body: payload.body,
    payload: payload as unknown as Json,
    status,
    sent_at: status === 'sent' ? now : null,
    created_at: now,
    error_message: errorMessage ?? null
  } satisfies Database['public']['Tables']['notification_log']['Insert'];

  const { error } = await supabase.from('notification_log').insert(stripUndefinedDeep(entry));
  if (error) {
    logger.warn('PWA: Failed to log notification', { subscriptionId: record.id, error });
  }
};

const getTargetSubscriptions = async (
  supabase: SupabaseClient<Database>,
  targetUsers?: string[],
  targetType: string = 'all'
): Promise<PushSubscriptionRow[]> => {
  if (targetType !== 'all' && (!targetUsers || targetUsers.length === 0)) {
    return [];
  }

  let query = supabase
    .from('push_subscriptions')
    .select(
      'id, user_id, endpoint, auth_key, p256dh_key, subscription_data, preferences, is_active, created_at, updated_at, deactivated_at'
    )
    .eq('is_active', true);

  if (Array.isArray(targetUsers) && targetUsers.length > 0) {
    query = query.in('user_id', targetUsers);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('PWA: Failed to load push subscriptions', error);
    throw new Error('Unable to load push subscriptions');
  }

  return data ?? [];
};

const sendPushNotifications = async (
  supabase: SupabaseClient<Database>,
  subscriptions: PushSubscriptionRow[],
  payload: NotificationPayload
): Promise<SendResult> => {
  const results: SendResult = {
    successful: 0,
    failed: 0,
    errors: []
  };

  for (const record of subscriptions) {
    const pushSubscription = mapToWebPushSubscription(record);

    if (!pushSubscription) {
      await deactivateSubscription(supabase, record.id);
      results.failed += 1;
      results.errors.push(`Missing subscription keys for user ${record.user_id}`);
      await logNotification(supabase, record, payload, 'failed', 'Missing subscription keys');
      continue;
    }

    try {
      await webPush.sendNotification(pushSubscription, JSON.stringify(payload));
      results.successful += 1;
      await logNotification(supabase, record, payload, 'sent');
    } catch (error) {
      results.failed += 1;
      const statusCode = (error as webPush.WebPushError)?.statusCode;
      const message = error instanceof Error ? error.message : 'Unknown error';

      results.errors.push(`Failed to send to ${record.user_id}: ${message}`);
      await logNotification(supabase, record, payload, 'failed', message);

      if (statusCode === 404 || statusCode === 410) {
        await deactivateSubscription(supabase, record.id);
      }
    }
  }

  return results;
};

const getNotificationHistory = async (
  supabase: SupabaseClient<Database>,
  userId?: string | null,
  limit: number = 10
) => {
  let query = supabase
    .from('notification_log')
    .select('id, title, body, status, sent_at, error_message, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('PWA: Failed to fetch notification history', error);
    return [];
  }

  return data ?? [];
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('PWA')) {
    return forbiddenError('PWA feature is disabled');
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
    return validationError({
      title: !title ? 'Title is required' : '',
      message: !message ? 'Message is required' : ''
    });
  }

  const supabase = await getSupabaseServerClient();

  let subscriptions: PushSubscriptionRow[];
  try {
    subscriptions = await getTargetSubscriptions(supabase, targetUsers, targetType);
  } catch (error) {
    return errorResponse('Failed to load subscriptions', 500, {
      hint: error instanceof Error ? error.message : String(error)
    });
  }

  if (subscriptions.length === 0) {
    return notFoundError('No active subscriptions found for target audience');
  }

  try {
    ensureWebPushConfigured();
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'PWA push notifications are not configured',
      503
    );
  }

  logger.info(`PWA: Sending push notification - "${title}" to ${targetType}`, {
    totalSubscriptions: subscriptions.length
  });

  const payload = buildpayload(title, message, url, icon, badge, tag, data);
  const results = await sendPushNotifications(supabase, subscriptions, payload);

  logger.info(`PWA: Push notification send results`, results);

  return successResponse(
    {
      message: 'Push notifications sent successfully',
      results: {
        total: subscriptions.length,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors
      },
      timestamp: new Date().toISOString()
    },
    undefined,
    201
  );
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('PWA')) {
    return forbiddenError('PWA feature is disabled');
  }

  const supabase = await getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const limit = Number.parseInt(searchParams.get('limit') ?? '10', 10);

  const history = await getNotificationHistory(supabase, userId, limit);

  return successResponse({
    history,
    timestamp: new Date().toISOString()
  });
});
