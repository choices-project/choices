/**
 * Device Flow Polling Endpoint
 *
 * Implements OAuth 2.0 Device Authorization Grant polling (RFC 8628)
 * POST /api/auth/device-flow/poll
 *
 * Polls for device authorization completion. Returns session when user completes authorization.
 */

import type { NextRequest } from 'next/server';

import {
  withErrorHandling,
  successResponse,
  rateLimitError,
  validationError,
  authError,
  parseBody,
} from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

// Constants reserved for future polling implementation
// const POLLING_INTERVAL_SECONDS = 5;
// const MAX_POLLING_ATTEMPTS = 60; // 5 minutes max (60 * 5 seconds)

type PollRequest = {
  deviceCode: string;
};

type PollResponse = {
  success: boolean;
  status: 'pending' | 'completed' | 'expired' | 'error';
  userId?: string;
  error?: string;
  errorDescription?: string;
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Rate limiting: More lenient for polling, but still prevent abuse
  // Allow 60 requests per 5 minutes (matches max polling attempts)
  const ip = request.headers.get('x-forwarded-for') ??
             request.headers.get('x-real-ip') ??
             'unknown';
  const userAgent = request.headers.get('user-agent') ?? undefined;

  const rateLimitResult = await apiRateLimiter.checkLimit(
    ip,
    '/api/auth/device-flow/poll',
    {
      maxRequests: 60,
      windowMs: 5 * 60 * 1000, // 5 minutes
      ...(userAgent ? { userAgent } : {}),
    }
  );

  if (!rateLimitResult.allowed) {
    logger.warn('Device flow polling rate limit exceeded', { ip });
    return rateLimitError(
      'Too many polling requests. Please wait before trying again.',
      rateLimitResult.retryAfter
    );
  }

  // Parse and validate request body
  const parsedBody = await parseBody<PollRequest>(request);
  if (!parsedBody.success) {
    return parsedBody.error;
  }

  const { deviceCode } = parsedBody.data;

  if (!deviceCode) {
    return validationError(
      { deviceCode: 'Device code is required' },
      'Missing device code'
    );
  }

  // Look up device flow record
  const supabase = await getSupabaseServerClient();
  // Type assertion to avoid deep type inference issues with .single()
  const { data: deviceFlow, error: fetchError } = await (supabase
    .from('device_flow')
    .select('*')
    .eq('device_code', deviceCode)
    .single() as unknown as Promise<{
      data: DeviceFlowRecord | null;
      error: any;
    }>);

  if (fetchError || !deviceFlow) {
    logger.warn('Device flow not found', { deviceCode: deviceCode.substring(0, 8) + '...' });
    return authError('Invalid device code');
  }

  // Type assertion for device_flow record
  type DeviceFlowRecord = {
    device_code: string;
    user_code: string;
    provider: string;
    status: string;
    expires_at: string;
    client_ip: string;
    redirect_to: string | null;
    scopes: string[];
    user_id?: string | null;
    completed_at?: string | null;
    created_at: string;
    updated_at: string;
    error_message?: string | null;
  };

  const flow = deviceFlow as DeviceFlowRecord;

  // Check if expired
  const expiresAt = new Date(flow.expires_at);
  if (expiresAt < new Date() && flow.status === 'pending') {
    // Mark as expired
    await (supabase
      .from('device_flow')
      .update({ status: 'expired' })
      .eq('device_code', deviceCode) as unknown as Promise<{ error: any }>);

    const response: PollResponse = {
      success: false,
      status: 'expired',
      error: 'expired_token',
      errorDescription: 'The device code has expired. Please request a new one.',
    };
    return successResponse(response);
  }

  // Check status
  if (flow.status === 'completed' && flow.user_id) {
    // User has completed authorization
    // Note: The actual session is created during OAuth flow on the verification page
    // We just need to signal completion - the client will handle session management
    const response: PollResponse = {
      success: true,
      status: 'completed',
      userId: flow.user_id,
      // Session tokens are managed by Supabase Auth cookies set during OAuth
      // Client should check for existing session after receiving this response
    };

    logger.info('Device flow completed', {
      userId: flow.user_id,
      provider: flow.provider,
    });

    return successResponse(response);
  }

  if (flow.status === 'error') {
    const response: PollResponse = {
      success: false,
      status: 'error',
      error: 'authorization_pending',
      errorDescription: flow.error_message || 'Authorization failed',
    };
    return successResponse(response);
  }

  // Still pending
  const response: PollResponse = {
    success: true,
    status: 'pending',
  };

  return successResponse(response);
});

