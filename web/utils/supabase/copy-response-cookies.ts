import type { NextResponse } from 'next/server';

/** Copy Set-Cookie headers from one NextResponse onto another (e.g. redirect after OAuth). */
export function copyResponseCookies(source: NextResponse, target: NextResponse): void {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      maxAge: cookie.maxAge,
      domain: cookie.domain,
      sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
    });
  }
}
