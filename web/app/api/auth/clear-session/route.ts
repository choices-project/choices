import { NextResponse } from 'next/server';

import {
  createCsrfErrorResponse,
  validateCsrfProtection,
} from '@/app/api/auth/_shared';
import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

import { clearAllAuthCookiesOnResponse } from '@/lib/auth/request-auth-cookies';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

async function clearSessionAndRedirect(request: NextRequest) {
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

/**
 * CSRF-protected server sign-out for nav logout recovery and `/clear-session`.
 * GET is disabled to prevent cross-site forced logout (logout CSRF).
 */
export async function POST(request: NextRequest) {
  if (!(await validateCsrfProtection(request))) {
    return createCsrfErrorResponse();
  }

  return clearSessionAndRedirect(request);
}

/** @deprecated Use POST with CSRF — GET enables logout CSRF via cross-site navigation. */
export async function GET(_request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Method not allowed. Use POST /api/auth/clear-session with X-CSRF-Token.',
      code: 'METHOD_NOT_ALLOWED',
    },
    {
      status: 405,
      headers: { Allow: 'POST' },
    },
  );
}
