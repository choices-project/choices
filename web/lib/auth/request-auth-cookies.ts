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
/** Expire every Supabase auth cookie on the response (host + `.choices-app.com`). */
export function clearAllAuthCookiesOnResponse(
  request: NextRequest,
  response: NextResponse,
): void {
  const hostname = getRequestHostname(request);
  const names = new Set<string>([
    'sb-access-token',
    'sb-refresh-token',
    'sb-session-expires',
  ]);

  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      names.add(cookie.name);
    }
  }

  const header = request.headers.get('cookie') ?? '';
  for (const match of header.matchAll(/(?:^|;\s*)(sb-[^=;]+)=/g)) {
    if (match[1]) {
      names.add(match[1].trim());
    }
  }

  for (const name of names) {
    clearCookieOnResponse(response, name, hostname);
  }
}

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
