import { humanizeOAuthExchangeError } from '@/lib/auth/request-auth-cookies';

/** Map `?error=` query values from /auth redirects into user-facing copy. */
export function messageFromAuthUrlError(encoded: string): string {
  try {
    return humanizeOAuthExchangeError(decodeURIComponent(encoded));
  } catch {
    return humanizeOAuthExchangeError(encoded);
  }
}
