import type { NextRequest, NextResponse } from 'next/server';

/**
 * Re-apply auth cookie attributes on the response the browser receives.
 * Matches login route behavior: httpOnly, secure on production domain, no explicit domain.
 */
export function finalizeAuthCookiesOnResponse(
  response: NextResponse,
  request: NextRequest,
): void {
  const hostname = request.headers.get('host') || '';
  const isProduction = process.env.NODE_ENV === 'production';
  const requireSecure = isProduction && hostname.includes('choices-app.com');

  for (const cookie of response.cookies.getAll()) {
    const isAuthCookie =
      cookie.name.includes('auth') ||
      cookie.name.includes('session') ||
      cookie.name.startsWith('sb-');

    if (!isAuthCookie) {
      continue;
    }

    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      secure: requireSecure,
      sameSite: (cookie.sameSite as 'strict' | 'lax' | 'none' | undefined) ?? 'lax',
      path: cookie.path ?? '/',
      maxAge: cookie.maxAge,
    });
  }
}
