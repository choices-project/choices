import { withErrorHandling, successResponse } from '@/lib/api';
import { createApiLogger } from '@/lib/utils/api-logger';

import { getOrSetCsrfCookie } from '../_shared';
import { CSRF_COOKIE } from '../_shared/cookies';

export const dynamic = 'force-dynamic';

/**
 * CSRF Token Endpoint
 *
 * Provides CSRF tokens to clients for API request protection
 * GET: Returns current CSRF token (creates one if none exists)
 *
 * Updated: November 6, 2025 - Modernized with standardized responses
 */

export const GET = withErrorHandling(async () => {
  const logger = createApiLogger('/api/auth/csrf', 'GET');

  // Get or create CSRF token
  const csrfToken = await getOrSetCsrfCookie();
  
  // Create response with token nested under data.token
  const response = successResponse({
    csrfToken,
    message: 'CSRF token retrieved successfully'
  });

  // Set CSRF cookie in response
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set(CSRF_COOKIE, csrfToken, {
    httpOnly: false, // Client needs to read this
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
});
