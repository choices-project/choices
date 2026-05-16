import { NextResponse } from 'next/server';

import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

import { finalizeAuthCookiesOnResponse } from '@/lib/auth/finalize-auth-cookies';
import { authError, successResponse, withErrorHandling } from '@/lib/api';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Read the httpOnly Supabase session on the server and return tokens so the
 * browser client can call `setSession`. Same-origin + credentials only.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const cookieCarrier = new NextResponse();
  const supabase = await getSupabaseApiRouteClient(request, cookieCarrier);
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
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
