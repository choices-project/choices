import type { NextRequest } from 'next/server';

export const CHOICES_AUTH_COOKIE_DOMAIN = '.choices-app.com';

export function getRequestHostname(
  request: NextRequest | Request,
): string {
  return (
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    ''
  );
}

export function isChoicesProductionHost(hostname: string): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    hostname.includes('choices-app.com')
  );
}

/** Shared httpOnly auth cookie attributes for apex + www in production. */
export function productionAuthCookieOptions(hostname: string): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  domain?: string;
} {
  const onProductionChoices = isChoicesProductionHost(hostname);
  return {
    httpOnly: true,
    secure: onProductionChoices,
    sameSite: 'lax',
    path: '/',
    ...(onProductionChoices ? { domain: CHOICES_AUTH_COOKIE_DOMAIN } : {}),
  };
}
