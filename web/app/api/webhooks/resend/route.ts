/**
 * Resend Webhook Handler
 *
 * Handles webhook events from Resend including:
 * - Email delivery status (sent, delivered, bounced, complained)
 * - Webhook signature verification for security
 * - Bounce and complaint handling for deliverability
 *
 * Security: Verifies webhook signatures using RESEND_WEBHOOK_SECRET
 */

import { createHmac } from 'node:crypto';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  withErrorHandling,
  successResponse,
  methodNotAllowed,
  errorResponse,
  forbiddenError,
} from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';



export const dynamic = 'force-dynamic';

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

/**
 * Verify Resend webhook signature
 * Resend signs webhooks with HMAC-SHA256 using the webhook secret
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    // Resend sends signature as hex string, compare securely
    return signature.toLowerCase() === expectedSignature.toLowerCase();
  } catch (error) {
    logger.error('Webhook signature verification failed', error);
    return false;
  }
}

/**
 * Handle bounce events
 * Bounces indicate delivery failures (hard/soft bounces)
 */
async function handleBounce(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  payload: Record<string, unknown>,
): Promise<void> {
  const data = (payload?.data as Record<string, unknown> | undefined) ?? {};
  const messageId = data?.id ?? payload?.id ?? null;
  const email = data?.to ?? payload?.to ?? null;
  const bounceType = (data?.bounce_type ?? data?.reason ?? 'unknown') as string;
  const reason = (data?.bounce_reason ?? data?.reason ?? 'unknown') as string;

  // Redact email address for security - only log domain
  const emailDomain = typeof email === 'string' && email.includes('@') 
    ? email.split('@')[1] 
    : 'unknown';
  logger.warn('Email bounce detected', {
    messageId,
    emailDomain,
    bounceType,
    reason,
  });

  if (supabase) {
    try {
      await (supabase as any).from('platform_analytics').insert({
        event_type: 'email_bounce',
        metadata: {
          messageId,
          email,
          bounceType,
          reason,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Failed to log bounce event', error);
    }
  }

  // Implement bounce handling logic
  if (supabase && typeof email === 'string') {
    try {
      // Find user by email in user_profiles table
      const { data: userProfile } = await (supabase as any)
        .from('user_profiles')
        .select('user_id')
        .eq('email', email)
        .single();
      
      if (userProfile?.user_id) {
        const userId = userProfile.user_id;
        const isHardBounce = bounceType === 'hard' || bounceType === 'permanent';
        
        // Update user privacy preferences to mark email as invalid for hard bounces
        if (isHardBounce) {
          const { error: updateError } = await (supabase as any)
            .from('user_privacy_preferences')
            .upsert({
              user_id: userId,
              allow_marketing: false,
              allow_contact: false,
              email_status: 'invalid',
              email_bounce_count: 1,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            });
          
          if (updateError) {
            logger.error('Failed to update user email status for hard bounce', {
              userId,
              emailDomain: typeof email === 'string' && email.includes('@') ? email.split('@')[1] : 'unknown',
              error: updateError,
            });
          } else {
            const emailDomain = typeof email === 'string' && email.includes('@') ? email.split('@')[1] : 'unknown';
            logger.info('Marked email as invalid due to hard bounce', { userId, emailDomain });
          }
        } else {
          // For soft bounces, increment bounce count but don't invalidate yet
          const { data: existingPrefs } = await (supabase as any)
            .from('user_privacy_preferences')
            .select('email_bounce_count')
            .eq('user_id', userId)
            .single();
          
          const bounceCount = (existingPrefs?.email_bounce_count || 0) + 1;
          
          // Invalidate after 3 soft bounces
          if (bounceCount >= 3) {
            await (supabase as any)
              .from('user_privacy_preferences')
              .upsert({
                user_id: userId,
                email_status: 'invalid',
                email_bounce_count: bounceCount,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id',
              });
          } else {
            await (supabase as any)
              .from('user_privacy_preferences')
              .upsert({
                user_id: userId,
                email_bounce_count: bounceCount,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id',
              });
          }
        }
      }
    } catch (error) {
      const emailDomain = typeof email === 'string' && email.includes('@') ? email.split('@')[1] : 'unknown';
      logger.error('Failed to handle bounce for user', { emailDomain, error });
    }
  }
}

/**
 * Handle complaint events (spam reports)
 * Complaints indicate user marked email as spam
 */
async function handleComplaint(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  payload: Record<string, unknown>,
): Promise<void> {
  const data = (payload?.data as Record<string, unknown> | undefined) ?? {};
  const messageId = data?.id ?? payload?.id ?? null;
  const email = data?.to ?? payload?.to ?? null;
  const complaintType = (data?.complaint_type ?? 'spam') as string;

  // Redact email address for security - only log domain
  const complaintEmailDomain = typeof email === 'string' && email.includes('@') 
    ? email.split('@')[1] 
    : 'unknown';
  logger.warn('Email complaint detected', {
    messageId,
    emailDomain: complaintEmailDomain,
    complaintType,
  });

  if (supabase) {
    try {
      await (supabase as any).from('platform_analytics').insert({
        event_type: 'email_complaint',
        metadata: {
          messageId,
          email,
          complaintType,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Failed to log complaint event', error);
    }
  }

  // Implement complaint handling logic
  if (supabase && typeof email === 'string') {
    try {
      // Find user by email in user_profiles table
      const { data: userProfile } = await (supabase as any)
        .from('user_profiles')
        .select('user_id')
        .eq('email', email)
        .single();
      
      if (userProfile?.user_id) {
        const userId = userProfile.user_id;
        
        // Immediately unsubscribe user from all marketing and contact emails
        const { error: updateError } = await (supabase as any)
          .from('user_privacy_preferences')
          .upsert({
            user_id: userId,
            allow_marketing: false,
            allow_contact: false,
            email_status: 'complained',
            email_complaint_count: 1,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });
        
        if (updateError) {
          const emailDomain = typeof email === 'string' && email.includes('@') ? email.split('@')[1] : 'unknown';
          logger.error('Failed to unsubscribe user after complaint', {
            userId,
            emailDomain,
            error: updateError,
          });
        } else {
          const emailDomain = typeof email === 'string' && email.includes('@') ? email.split('@')[1] : 'unknown';
          logger.info('Unsubscribed user from emails due to complaint', { userId, emailDomain });
        }
        
        // Also update notification preferences to disable email notifications
        const { error: notifError } = await (supabase as any)
          .from('user_notification_preferences')
          .upsert({
            user_id: userId,
            email_enabled: false,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });
        
        if (notifError) {
          logger.warn('Failed to update notification preferences after complaint', {
            userId,
            error: notifError,
          });
        }
      }
    } catch (error) {
      const complaintEmailDomain = typeof email === 'string' && email.includes('@') ? email.split('@')[1] : 'unknown';
      logger.error('Failed to handle complaint for user', { emailDomain: complaintEmailDomain, error });
    }
  }
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Get raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get('resend-signature') ?? request.headers.get('x-resend-signature');

  // Verify webhook signature if secret is configured
  if (RESEND_WEBHOOK_SECRET) {
    if (!verifyWebhookSignature(rawBody, signature, RESEND_WEBHOOK_SECRET)) {
      logger.warn('Resend webhook signature verification failed', {
        hasSignature: !!signature,
        hasSecret: !!RESEND_WEBHOOK_SECRET,
      });
      return forbiddenError('Invalid webhook signature');
    }
  } else {
    logger.warn('RESEND_WEBHOOK_SECRET not configured; webhook signature verification disabled');
  }

  // Parse payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    logger.error('Failed to parse Resend webhook payload', error);
    return errorResponse('Invalid JSON payload', 400);
  }

  const supabase = await getSupabaseServerClient();
  const eventType = String(payload?.type ?? 'unknown');
  const data = (payload?.data as Record<string, unknown> | undefined) ?? {};
  const messageId = data?.id ?? payload?.id ?? null;
  const to = data?.to ?? payload?.to ?? null;
  const status = data?.status ?? payload?.status ?? null;

  // Handle specific event types
  if (eventType === 'email.bounced' || eventType === 'bounce') {
    await handleBounce(supabase, payload);
  } else if (eventType === 'email.complained' || eventType === 'complaint') {
    await handleComplaint(supabase, payload);
  }

  // Log all webhook events for analytics
  if (supabase) {
    try {
      await (supabase as any)
        .from('platform_analytics')
        .insert({
          event_type: 'resend_webhook',
          metadata: {
            eventType,
            messageId,
            to,
            status,
            timestamp: new Date().toISOString(),
          },
        });
    } catch (error) {
      // Webhook handling should always succeed; ignore analytics insertion errors
      logger.debug('Analytics insertion failed (non-blocking)', error);
    }
  }

  return successResponse({ ok: true, eventType });
});

export const GET = withErrorHandling(async () => methodNotAllowed(['POST']));

