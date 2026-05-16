import { NextResponse } from 'next/server';

import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

import { finalizeAuthCookiesOnResponse } from '@/lib/auth/finalize-auth-cookies';
import {
  isCorruptAuthCookieError,
  sanitizeAuthCookiesForRoute,
} from '@/lib/auth/request-auth-cookies';
import { authError, successResponse, withErrorHandling } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Read the httpOnly Supabase session on the server and return tokens so the
 * browser client can call `setSession`. Same-origin + credentials only.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const cookieCarrier = new NextResponse();
  sanitizeAuthCookiesForRoute(request, cookieCarrier);

  let session = null;
  let sessionError: Error | null = null;

  try {
    const supabase = await getSupabaseApiRouteClient(request, cookieCarrier);
    const result = await supabase.auth.getSession();
    session = result.data.session;
    sessionError = result.error;
  } catch (err) {
    if (isCorruptAuthCookieError(err)) {
      logger.warn('GET /api/auth/session: cleared corrupt auth cookies', { err });
      const response = authError('Not authenticated');
      sanitizeAuthCookiesForRoute(request, response);
      return response;
    }
    throw err;
  }

  if (sessionError || !session) {
    return authError('Not authenticated');
  }

  const response = successResponse({
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: session.user,
    },
  });

  for (const cookie of cookieCarrier.cookies.getAll()) {
    response.cookies.set(cookie.name, cookie.value);
  }
  finalizeAuthCookiesOnResponse(response, request);

  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
});
