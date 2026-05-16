import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

import { getCanonicalSiteOrigin } from '@/lib/auth/canonical-site-origin';
import { normalizePostAuthRedirectPath } from '@/lib/auth/normalize-post-auth-redirect';
import { logger } from '@/lib/utils/logger';

import type { Provider } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const ALL_OAUTH_PROVIDERS = [
  'google',
  'github',
  'apple',
  'facebook',
  'twitter',
  'linkedin',
  'discord',
  'instagram',
  'tiktok',
] as const;

type OAuthProvider = (typeof ALL_OAUTH_PROVIDERS)[number];

function getEnabledOAuthProviders(): OAuthProvider[] {
  const envValue = process.env.NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS;
  const enabled =
    envValue && envValue.trim()
      ? envValue.split(',').map((p) => p.trim()).filter(Boolean)
      : ['google'];
  return ALL_OAUTH_PROVIDERS.filter((p) => enabled.includes(p));
}

function isOAuthProvider(value: string): value is OAuthProvider {
  return (ALL_OAUTH_PROVIDERS as readonly string[]).includes(value);
}

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

  if (!isOAuthProvider(providerParam) || !getEnabledOAuthProviders().includes(providerParam)) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent('OAuth provider is not available')}`,
    );
  }

  const rawRedirect = new URL(request.url).searchParams.get('redirectTo') ?? '/feed';
  const redirectTarget = normalizePostAuthRedirectPath(rawRedirect);
  const callbackUrl = `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTarget)}`;

  const oauthResponse = NextResponse.redirect(`${origin}/auth`, 303);

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
