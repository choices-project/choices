import type { NextRequest, NextResponse } from 'next/server';

import {
  getRequestHostname,
  isChoicesProductionHost,
  productionAuthCookieOptions,
} from '@/lib/auth/production-auth-cookies';

function isAuthCookieName(name: string): boolean {
  return (
    name.includes('auth') ||
    name.includes('session') ||
    name.startsWith('sb-')
  );
}

/**
 * Re-apply auth cookie attributes on the response the browser receives.
 * Production uses `Domain=.choices-app.com` so apex PWA and www redirects share sessions.
 */
export function finalizeAuthCookiesOnResponse(
  response: NextResponse,
  request: NextRequest,
): void {
  const hostname = getRequestHostname(request);
  const onProductionChoices = isChoicesProductionHost(hostname);
  const baseOptions = productionAuthCookieOptions(hostname);

  const authCookies = response.cookies
    .getAll()
    .filter((cookie) => isAuthCookieName(cookie.name));

  if (onProductionChoices) {
    for (const cookie of authCookies) {
      response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
    }
  }

  for (const cookie of authCookies) {
    response.cookies.set(cookie.name, cookie.value, {
      ...baseOptions,
      sameSite:
        (cookie.sameSite as 'strict' | 'lax' | 'none' | undefined) ??
        baseOptions.sameSite,
      maxAge: cookie.maxAge,
    });
  }
}
