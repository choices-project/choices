import type { NextRequest, NextResponse } from 'next/server';

import { productionAuthCookieOptions } from '@/lib/auth/production-auth-cookies';
import {
  dedupeCookiesByName,
  detectCorruptSupabaseAuthCookies,
} from '@/utils/supabase/sanitize-cookies';

function getRequestHostname(request: NextRequest | Request): string {
  return (
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    ''
  );
}

/** Clear a cookie on the response (host-scoped and production domain when applicable). */
export function clearCookieOnResponse(
  response: NextResponse,
  name: string,
  hostname: string,
): void {
  const base = productionAuthCookieOptions(hostname);
  response.cookies.set(name, '', { path: '/', maxAge: 0 });
  if (base.domain) {
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      domain: base.domain,
    });
  }
}

/**
 * Drop corrupt Supabase auth cookies from the request adapter and expire them on the response.
 */
export function sanitizeAuthCookiesForRoute(
  request: NextRequest,
  response: NextResponse,
): Array<{ name: string; value: string }> {
  const hostname = getRequestHostname(request);
  const all = dedupeCookiesByName(request.cookies.getAll());
  const corrupt = detectCorruptSupabaseAuthCookies(all);

  for (const name of corrupt) {
    clearCookieOnResponse(response, name, hostname);
  }

  return all.filter((cookie) => !corrupt.has(cookie.name));
}

/** Remove stale PKCE verifier cookies before starting a new OAuth round trip. */
export function clearStaleOAuthCookies(
  request: NextRequest,
  response: NextResponse,
): void {
  const hostname = getRequestHostname(request);
  const corrupt = detectCorruptSupabaseAuthCookies(
    dedupeCookiesByName(request.cookies.getAll()),
  );

  for (const cookie of request.cookies.getAll()) {
    const isVerifier = cookie.name.includes('code-verifier');
    const isCorruptAuth = corrupt.has(cookie.name);
    if (isVerifier || isCorruptAuth) {
      clearCookieOnResponse(response, cookie.name, hostname);
    }
  }
}

export function humanizeOAuthExchangeError(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes('code challenge') ||
    lower.includes('code verifier') ||
    lower.includes('bad_code_verifier')
  ) {
    return 'Sign-in was interrupted or started twice. Please try GitHub again once (do not use the back button during sign-in).';
  }
  if (lower.includes('invalid utf-8') || lower.includes('auth session missing')) {
    return 'Your browser had a stale sign-in cookie. Please try again; we cleared it automatically.';
  }
  return raw;
}

export function isCorruptAuthCookieError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('Invalid UTF-8 sequence');
}
