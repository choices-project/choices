import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

import { finalizeAuthCookiesOnResponse } from '@/lib/auth/finalize-auth-cookies';
import {
  parsePostAuthRedirectFromSearchParams,
  resolvePostAuthRedirect,
} from '@/lib/auth/resolve-post-auth-redirect';
import { devLog } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * OAuth PKCE callback: exchange code on the server, attach httpOnly cookies to the
 * redirect response, then send the user to /auth/finish for client hydration.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const postAuthParams = parsePostAuthRedirectFromSearchParams(searchParams);
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    devLog('OAuth error:', { error, errorDescription });
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(errorDescription ?? error)}`,
    );
  }

  if (!code) {
    devLog('No authentication code provided');
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent('No authentication code provided')}`,
    );
  }

  const nextRequest = new NextRequest(request);

  try {
    const finishUrl = new URL('/auth/finish', origin);
    const redirectResponse = NextResponse.redirect(finishUrl.toString(), 303);
    const supabase = await getSupabaseApiRouteClient(nextRequest, redirectResponse);

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      devLog('Session exchange error:', { error: exchangeError });
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent(exchangeError.message)}`,
      );
    }

    if (!data.session || !data.user) {
      devLog('No session returned from code exchange', {});
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent('Authentication failed - no session created')}`,
      );
    }

    devLog('Successfully authenticated user:', { email: data.user.email });

    const finalRedirect = await resolvePostAuthRedirect(
      supabase,
      data.user.id,
      postAuthParams,
    );
    finishUrl.searchParams.set('redirectTo', finalRedirect);
    redirectResponse.headers.set('Location', finishUrl.toString());

    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    if (setSessionError) {
      devLog('setSession on redirect failed:', { error: setSessionError });
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent(setSessionError.message)}`,
      );
    }

    finalizeAuthCookiesOnResponse(redirectResponse, nextRequest);
    redirectResponse.headers.set('cache-control', 'no-store');
    return redirectResponse;
  } catch (err) {
    devLog('Unexpected error in auth callback:', { error: err });
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent('Unexpected authentication error')}`,
    );
  }
}
