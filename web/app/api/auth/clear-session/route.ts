import { NextResponse } from 'next/server';

import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

import { clearAllAuthCookiesOnResponse } from '@/lib/auth/request-auth-cookies';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Server-side session reset: clears httpOnly Supabase cookies (invisible to
 * `document.cookie` on `/clear-session`) and redirects to `/` with a cache-busting
 * query param so browsers do not replay a cached 307 to `/polls`.
 */
export async function GET(request: NextRequest) {
  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.set('session-cleared', String(Date.now()));

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
