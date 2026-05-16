import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

import { finalizeAuthCookiesOnResponse } from '@/lib/auth/finalize-auth-cookies';
import { getCanonicalSiteOrigin } from '@/lib/auth/canonical-site-origin';
import { normalizePostAuthRedirectPath } from '@/lib/auth/normalize-post-auth-redirect';
import { logger } from '@/lib/utils/logger';

import { isEnabledOAuthProvider } from '@/lib/auth/enabled-oauth-providers';

import type { Provider } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Server-initiated OAuth: sets PKCE verifier cookies on the redirect to the provider,
 * then returns to GET /auth/callback for code exchange.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: providerParam } = await context.params;
  const origin = getCanonicalSiteOrigin(request.url);

  if (!isEnabledOAuthProvider(providerParam)) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent('OAuth provider is not available')}`,
    );
  }

  const rawRedirect = new URL(request.url).searchParams.get('redirectTo') ?? '/feed';
  const redirectTarget = normalizePostAuthRedirectPath(rawRedirect);
  const callbackUrl = `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTarget)}`;

  const oauthResponse = new NextResponse(null, { status: 303 });

  try {
    const supabase = await getSupabaseApiRouteClient(request, oauthResponse);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: providerParam as Provider,
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      logger.warn('OAuth sign-in initiation failed', {
        provider: providerParam,
        message: error.message,
      });
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent(error.message)}`,
      );
    }

    if (!data?.url) {
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent('OAuth provider did not return a sign-in URL')}`,
      );
    }

    oauthResponse.headers.set('Location', data.url);
    finalizeAuthCookiesOnResponse(oauthResponse, request);
    oauthResponse.headers.set('cache-control', 'no-store');
    return oauthResponse;
  } catch (err) {
    logger.error(
      'Unexpected OAuth initiation error',
      err instanceof Error ? err : new Error(String(err)),
    );
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent('Could not start OAuth sign-in')}`,
    );
  }
}
