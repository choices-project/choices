import { NextResponse } from 'next/server';

import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

import { normalizePostAuthRedirectPath } from '@/lib/auth/normalize-post-auth-redirect';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type SyncSessionBody = {
  access_token?: string;
  refresh_token?: string;
  redirectTo?: string;
};

/**
 * Fallback: establish httpOnly Supabase cookies, then redirect (303).
 * Primary flows set cookies on login/register/OAuth server routes instead.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as SyncSessionBody;
    const redirectPath = normalizePostAuthRedirectPath(body.redirectTo ?? '/feed');
    const redirectResponse = NextResponse.redirect(new URL(redirectPath, request.url), 303);

    const accessToken = body.access_token?.trim();
    const refreshToken = body.refresh_token?.trim();

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { ok: false, error: 'Missing session tokens' },
        { status: 400 },
      );
    }

    const supabase = await getSupabaseApiRouteClient(request, redirectResponse);
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      logger.warn('sync-session setSession failed', { message: error.message });
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }

    redirectResponse.headers.set('cache-control', 'no-store');
    return redirectResponse;
  } catch (error) {
    logger.error(
      'sync-session unexpected error',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json(
      { ok: false, error: 'Could not establish session' },
      { status: 500 },
    );
  }
}
