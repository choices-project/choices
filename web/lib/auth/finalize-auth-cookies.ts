import type { NextRequest, NextResponse } from 'next/server';

function isAuthCookieName(name: string): boolean {
  return (
    name.includes('auth') ||
    name.includes('session') ||
    name.startsWith('sb-')
  );
}

/**
 * Re-apply auth cookie attributes on the response the browser receives.
 * Clears legacy `.choices-app.com` domain duplicates, then sets host-scoped cookies
 * (matches login route: httpOnly, secure on production, no explicit domain).
 */
export function finalizeAuthCookiesOnResponse(
  response: NextResponse,
  request: NextRequest,
): void {
  const hostname =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    '';
  const isProduction = process.env.NODE_ENV === 'production';
  const requireSecure = isProduction && hostname.includes('choices-app.com');

  const authCookies = response.cookies
    .getAll()
    .filter((cookie) => isAuthCookieName(cookie.name));

  if (requireSecure) {
    for (const cookie of authCookies) {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        path: '/',
        domain: '.choices-app.com',
      });
    }
  }

  for (const cookie of authCookies) {
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      secure: requireSecure,
      sameSite: (cookie.sameSite as 'strict' | 'lax' | 'none' | undefined) ?? 'lax',
      path: cookie.path ?? '/',
      maxAge: cookie.maxAge,
    });
  }
}
