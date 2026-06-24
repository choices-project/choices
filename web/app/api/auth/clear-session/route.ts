import { NextResponse } from 'next/server';

import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

import { clearAllAuthCookiesOnResponse } from '@/lib/auth/request-auth-cookies';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Server-side sign-out: clears httpOnly Supabase cookies (invisible to JS) and
 * redirects to the marketing home. Used by nav logout and `/clear-session`.
 */
export async function GET(request: NextRequest) {
  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.set('loggedOut', '1');

  const response = NextResponse.redirect(redirectUrl, 302);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');

  try {
    const supabase = await getSupabaseApiRouteClient(request, response);
    await supabase.auth.signOut();
  } catch {
    // Still expire cookies below even if signOut fails.
  }

  clearAllAuthCookiesOnResponse(request, response);
  return response;
}
