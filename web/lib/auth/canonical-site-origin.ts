import { getValidatedEnv } from '@/lib/config/env';

/** Apex host for production OAuth callbacks and PWA scope (matches marketing domain). */
export const CHOICES_APEX_ORIGIN = 'https://choices-app.com';

/**
 * Normalize production host to apex so OAuth/PWA share one origin family.
 * Env may still say www until Vercel vars are updated.
 */
export function normalizeChoicesProductionOrigin(origin: string): string {
  const trimmed = origin.replace(/\/+$/, '');
  try {
    const url = new URL(trimmed);
    if (url.hostname === 'www.choices-app.com') {
      url.hostname = 'choices-app.com';
      return url.origin;
    }
  } catch {
    // fall through
  }
  return trimmed;
}

/** Production-safe origin for OAuth callback URLs (env first, then request host). */
export function getCanonicalSiteOrigin(requestUrl: string): string {
  const cfg = getValidatedEnv();
  const fromEnv = cfg.NEXT_PUBLIC_SITE_URL ?? cfg.NEXT_PUBLIC_BASE_URL ?? '';
  const raw = fromEnv
    ? fromEnv.replace(/\/+$/, '')
    : new URL(requestUrl).origin;
  return normalizeChoicesProductionOrigin(raw);
}
