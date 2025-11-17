/**
 * Device Flow Authorization Endpoint
 * 
 * Implements OAuth 2.0 Device Authorization Grant (RFC 8628)
 * POST /api/auth/device-flow
 * 
 * Generates a device code and user code for limited-input devices.
 */

import { randomBytes } from 'crypto';

import type { NextRequest } from 'next/server';

import {
  withErrorHandling,
  successResponse,
  rateLimitError,
  validationError,
  parseBody,
} from '@/lib/api';
import type { DeviceFlowRequest, DeviceFlowResponse } from '@/lib/core/auth/types';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

// OAuth 2.0 Device Flow constants (RFC 8628)
const DEVICE_CODE_LENGTH = 40; // bytes, will be base64url encoded
const USER_CODE_LENGTH = 8; // characters, user-friendly format
const USER_CODE_CHARS = 'BCDFGHJKLMNPQRSTVWXYZ'; // Exclude vowels and ambiguous chars
const EXPIRES_IN_SECONDS = 1800; // 30 minutes
const POLLING_INTERVAL_SECONDS = 5; // Recommended by RFC 8628

/**
 * Generate a secure device code (base64url encoded random bytes)
 */
function generateDeviceCode(): string {
  const bytes = randomBytes(DEVICE_CODE_LENGTH);
  return bytes.toString('base64url');
}

/**
 * Generate a user-friendly code (8 characters, no vowels/ambiguous)
 */
function generateUserCode(): string {
  let code = '';
  for (let i = 0; i < USER_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * USER_CODE_CHARS.length);
    code += USER_CODE_CHARS[randomIndex];
  }
  // Format as XXXX-XXXX for readability
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Rate limiting: 3 device code requests per hour per IP
  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             'unknown';
  const userAgent = request.headers.get('user-agent') ?? undefined;
  
  const rateLimitResult = await apiRateLimiter.checkLimit(
    ip,
    '/api/auth/device-flow',
    {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      ...(userAgent ? { userAgent } : {}),
    }
  );

  if (!rateLimitResult.allowed) {
    logger.warn('Device flow rate limit exceeded', { ip });
    return rateLimitError(
      'Too many device code requests. Please try again later.',
      rateLimitResult.retryAfter
    );
  }

  // Parse and validate request body
  const parsedBody = await parseBody<DeviceFlowRequest>(request);
  if (!parsedBody.success) {
    return parsedBody.error;
  }

  const { provider, redirectTo, scopes = [] } = parsedBody.data;

  // Validate provider
  const validProviders = ['google', 'github', 'facebook', 'twitter', 'linkedin', 'discord'];
  if (!provider || !validProviders.includes(provider)) {
    return validationError(
      { provider: `Provider must be one of: ${validProviders.join(', ')}` },
      'Invalid provider'
    );
  }

  // Generate codes
  const deviceCode = generateDeviceCode();
  const userCodeFormatted = generateUserCode(); // Formatted for display (XXXX-XXXX)
  const userCodeNormalized = userCodeFormatted.replace(/-/g, '').toUpperCase(); // Stored without dashes
  const expiresAt = new Date(Date.now() + EXPIRES_IN_SECONDS * 1000);

  // Store in database (store normalized code without dashes)
  const supabase = await getSupabaseServerClient();
  const { error: insertError } = await (supabase
    .from('device_flow')
    .insert({
      device_code: deviceCode,
      user_code: userCodeNormalized,
      provider,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      client_ip: ip,
      redirect_to: redirectTo || null,
      scopes: scopes || [],
    }) as unknown as Promise<{ error: any }>);

  if (insertError) {
    logger.error('Failed to create device flow record', { error: insertError });
    return validationError(
      { database: 'Failed to create device authorization' },
      'Internal server error'
    );
  }

  // Construct verification URI
  const origin = request.headers.get('origin') || 
                 request.headers.get('host') || 
                 'https://choices.app';
  const verificationUri = `${origin}/auth/device-flow/verify`;

  logger.info('Device flow code generated', {
    provider,
    userCode: userCodeFormatted,
    expiresAt: expiresAt.toISOString(),
  });

  const response: DeviceFlowResponse = {
    success: true,
    deviceCode,
    userCode: userCodeFormatted, // Return formatted code for display
    verificationUri,
    expiresIn: EXPIRES_IN_SECONDS,
    interval: POLLING_INTERVAL_SECONDS,
  };

  return successResponse(response);
});

