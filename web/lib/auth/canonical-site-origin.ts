import { getValidatedEnv } from '@/lib/config/env';

/** Production-safe origin for OAuth callback URLs (env first, then request host). */
export function getCanonicalSiteOrigin(requestUrl: string): string {
  const cfg = getValidatedEnv();
  const fromEnv = cfg.NEXT_PUBLIC_SITE_URL ?? cfg.NEXT_PUBLIC_BASE_URL ?? '';
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }
  return new URL(requestUrl).origin;
}
