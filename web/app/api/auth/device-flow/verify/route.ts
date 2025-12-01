/**
 * Device Flow Verification Endpoint
 * 
 * POST /api/auth/device-flow/verify
 * 
 * Verifies user code and completes device authorization.
 * This is called when the user enters their user code on the verification page.
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

type VerifyRequest = {
  userCode: string;
  provider: string;
};

type VerifyResponse = {
  success: boolean;
  message?: string;
  error?: string;
  errorDescription?: string;
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Rate limiting: 10 verification attempts per 15 minutes per IP
  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             'unknown';
  const userAgent = request.headers.get('user-agent') ?? undefined;
  
  const rateLimitResult = await apiRateLimiter.checkLimit(
    ip,
    '/api/auth/device-flow/verify',
    {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
      ...(userAgent ? { userAgent } : {}),
    }
  );

  if (!rateLimitResult.allowed) {
    logger.warn('Device flow verification rate limit exceeded', { ip });
    return rateLimitError(
      'Too many verification attempts. Please try again later.',
      rateLimitResult.retryAfter
    );
  }

  // Parse and validate request body
  const parsedBody = await parseBody<VerifyRequest>(request);
  if (!parsedBody.success) {
    return parsedBody.error;
  }

  const { userCode, provider } = parsedBody.data;

  if (!userCode) {
    return validationError(
      { userCode: 'User code is required' },
      'Missing user code'
    );
  }

  if (!provider) {
    return validationError(
      { provider: 'Provider is required' },
      'Missing provider'
    );
  }

  // Normalize user code (remove dashes, uppercase)
  const normalizedUserCode = userCode.replace(/-/g, '').toUpperCase();

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

  // Look up device flow record by user code
  const supabase = await getSupabaseServerClient();
  // Type assertion to avoid deep type inference issues with .single()
  const { data: deviceFlow, error: fetchError } = await (supabase
    .from('device_flow')
    .select('*')
    .eq('user_code', normalizedUserCode)
    .eq('provider', provider)
    .single() as unknown as Promise<{
      data: DeviceFlowRecord | null;
      error: any;
    }>);

  if (fetchError || !deviceFlow) {
    logger.warn('Device flow not found for user code', {
      userCode: normalizedUserCode.substring(0, 4) + '...',
      provider,
    });
    return authError('Invalid user code or provider');
  }

  const flow = deviceFlow as DeviceFlowRecord;

  // Check if expired
  const expiresAt = new Date(flow.expires_at);
  if (expiresAt < new Date()) {
    await (supabase
      .from('device_flow')
      .update({ status: 'expired' })
      .eq('user_code', normalizedUserCode) as unknown as Promise<{ error: any }>);

    const response: VerifyResponse = {
      success: false,
      error: 'expired_token',
      errorDescription: 'This code has expired. Please request a new one.',
    };
    return successResponse(response);
  }

  // Check if already completed
  if (flow.status === 'completed') {
    const response: VerifyResponse = {
      success: false,
      error: 'already_used',
      errorDescription: 'This code has already been used.',
    };
    return successResponse(response);
  }

  // Get current user (must be authenticated to complete device flow)
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    // User needs to authenticate first via OAuth
    // Redirect to OAuth provider
    // Note: origin would be used for redirect URL in production
    // const origin = request.headers.get('origin') || 
    //                request.headers.get('host') || 
    //                'https://choices.app';
    
    // For now, return an error indicating user needs to authenticate
    // In production, you'd redirect to the OAuth provider
    const response: VerifyResponse = {
      success: false,
      error: 'authentication_required',
      errorDescription: 'Please sign in with your account to complete device authorization.',
    };
    return successResponse(response);
  }

  // Complete device flow
  const { error: updateError } = await (supabase
    .from('device_flow')
    .update({
      status: 'completed',
      user_id: user.id,
      completed_at: new Date().toISOString(),
    })
    .eq('user_code', normalizedUserCode) as unknown as Promise<{ error: any }>);

  if (updateError) {
    logger.error('Failed to complete device flow', { error: updateError });
    return validationError(
      { database: 'Failed to complete authorization' },
      'Internal server error'
    );
  }

  logger.info('Device flow verified and completed', {
    userId: user.id,
    provider: flow.provider,
    userCode: normalizedUserCode.substring(0, 4) + '...',
  });

  const response: VerifyResponse = {
    success: true,
    message: 'Device authorization completed successfully. You can now return to your device.',
  };

  return successResponse(response);
});

