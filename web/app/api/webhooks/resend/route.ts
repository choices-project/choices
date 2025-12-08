import { createHmac, timingSafeEqual } from 'crypto';

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, methodNotAllowed, forbiddenError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Verify Resend webhook signature using HMAC-SHA256
 * Resend sends webhook signature in the 'svix-signature' header
 * Format: t=<timestamp>,v1=<signature>
 */
function verifyResendWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Parse signature header (format: t=<timestamp>,v1=<signature>)
    const parts = signature.split(',');
    let timestamp = '';
    let signatureValue = '';

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't' && value) {
        timestamp = value;
      } else if (key === 'v1' && value) {
        signatureValue = value;
      }
    }

    if (!timestamp || !signatureValue) {
      return false;
    }

    // Verify timestamp is recent (within 5 minutes)
    const timestampMs = parseInt(timestamp, 10) * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (Math.abs(now - timestampMs) > fiveMinutes) {
      logger.warn('Resend webhook signature timestamp too old or too far in future', {
        timestamp: new Date(timestampMs).toISOString(),
        now: new Date(now).toISOString(),
      });
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('base64');

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'base64');
    const receivedBuffer = Buffer.from(signatureValue, 'base64');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    logger.error('Error verifying Resend webhook signature:', error);
    return false;
  }
}

/**
 * Handle bounce events from Resend
 */
async function handleBounce(
  supabase: any,
  payload: any
): Promise<void> {
  const messageId = payload?.data?.id ?? payload?.id;
  const to = payload?.data?.to;
  const bounceType = payload?.data?.bounce_type ?? 'unknown';

  try {
    await supabase.from('platform_analytics').insert({
      event_type: 'email_bounce',
      metadata: {
        messageId,
        to: to ? to.split('@')[1] : null, // Only log domain for privacy
        bounceType,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to log bounce event:', error);
  }
}

/**
 * Handle complaint events from Resend (spam reports)
 */
async function handleComplaint(
  supabase: any,
  payload: any
): Promise<void> {
  const messageId = payload?.data?.id ?? payload?.id;
  const to = payload?.data?.to;
  const complaintType = payload?.data?.complaint_type ?? 'unknown';

  try {
    await supabase.from('platform_analytics').insert({
      event_type: 'email_complaint',
      metadata: {
        messageId,
        to: to ? to.split('@')[1] : null, // Only log domain for privacy
        complaintType,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to log complaint event:', error);
  }
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Get webhook secret from environment
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  // Read raw body once for signature verification and parsing
  const rawBody = await request.text();
  let payload: any;

  // Verify webhook signature if secret is configured
  if (webhookSecret) {
    // Resend uses Svix for webhooks, signature is in 'svix-signature' header
    // Alternative: some webhook providers use 'x-resend-signature'
    const signature = request.headers.get('svix-signature') ??
                     request.headers.get('x-resend-signature') ??
                     request.headers.get('resend-signature');

    if (!verifyResendWebhookSignature(rawBody, signature, webhookSecret)) {
      logger.warn('Invalid Resend webhook signature', {
        hasSignature: !!signature,
        ip: request.headers.get('x-forwarded-for'),
      });
      return forbiddenError('Invalid webhook signature');
    }
  } else {
    // In development, log warning but allow (for testing)
    if (process.env.NODE_ENV === 'production') {
      logger.error('RESEND_WEBHOOK_SECRET not configured in production');
      return errorResponse('Webhook secret not configured', 500);
    }
    logger.warn('Resend webhook signature verification disabled (RESEND_WEBHOOK_SECRET not set)');
  }

  // Parse payload
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    logger.error('Failed to parse Resend webhook payload:', error);
    return errorResponse('Invalid payload', 400);
  }

  const supabase = await getSupabaseServerClient();
  const eventType = String(payload?.type ?? 'unknown');
  const messageId = payload?.data?.id ?? payload?.id ?? null;
  const to = payload?.data?.to ?? null;
  const status = payload?.data?.status ?? null;

  // Handle specific event types
  if (eventType === 'email.bounced' || eventType === 'bounce') {
    await handleBounce(supabase, payload);
  } else if (eventType === 'email.complained' || eventType === 'complaint') {
    await handleComplaint(supabase, payload);
  }

  if (supabase) {
    try {
      await (supabase as any)
        .from('platform_analytics')
        .insert({
          event_type: 'resend_webhook',
          metadata: { eventType, messageId, to, status },
        });
    } catch {
      // Webhook handling should always succeed; ignore analytics insertion errors
    }
  }

  return successResponse({ ok: true });
});

export const GET = withErrorHandling(async () => methodNotAllowed(['POST']));

