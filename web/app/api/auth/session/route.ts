import { NextResponse } from 'next/server';

import {
  createCsrfErrorResponse,
  validateCsrfProtection,
} from '@/app/api/auth/_shared';
import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

import { authError, successResponse, withErrorHandling } from '@/lib/api';
import { finalizeAuthCookiesOnResponse } from '@/lib/auth/finalize-auth-cookies';
import {
  isCorruptAuthCookieError,
  sanitizeAuthCookiesForRoute,
} from '@/lib/auth/request-auth-cookies';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

async function readValidatedSession(request: NextRequest, cookieCarrier: NextResponse) {
  const supabase = await getSupabaseApiRouteClient(request, cookieCarrier);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { session: null, userError: userError ?? new Error('Not authenticated') };
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return { session: null, userError: sessionError ?? new Error('Not authenticated') };
  }

  return { session, userError: null };
}

/**
 * Mirror httpOnly Supabase cookies into the browser client (`setSession`).
 * POST + CSRF only — tokens never returned on GET to reduce accidental leakage.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!(await validateCsrfProtection(request))) {
    return createCsrfErrorResponse();
  }

  const cookieCarrier = new NextResponse();
  sanitizeAuthCookiesForRoute(request, cookieCarrier);

  let session = null;

  try {
    const result = await readValidatedSession(request, cookieCarrier);
    session = result.session;
    if (result.userError || !session) {
      return authError('Not authenticated');
    }
  } catch (err) {
    if (isCorruptAuthCookieError(err)) {
      logger.warn('POST /api/auth/session: cleared corrupt auth cookies', { err });
      const response = authError('Not authenticated');
      sanitizeAuthCookiesForRoute(request, response);
      return response;
    }
    throw err;
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

/** @deprecated Use POST with CSRF. */
export const GET = withErrorHandling(async () => {
  return NextResponse.json(
    {
      error: 'Method not allowed. Use POST /api/auth/session with X-CSRF-Token.',
      code: 'METHOD_NOT_ALLOWED',
    },
    {
      status: 405,
      headers: { Allow: 'POST' },
    },
  );
});
