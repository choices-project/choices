import { getValidatedEnv } from '@/lib/config/env';

/** Canonical production origin (matches Vercel primary domain). */
export const CHOICES_CANONICAL_ORIGIN = 'https://www.choices-app.com';

/**
 * Normalize production host to www so OAuth/PWA match Vercel's primary domain.
 * Apex requests are redirected to www at the edge; callbacks must target www.
 */
export function normalizeChoicesProductionOrigin(origin: string): string {
  const trimmed = origin.replace(/\/+$/, '');
  try {
    const url = new URL(trimmed);
    if (url.hostname === 'choices-app.com') {
      url.hostname = 'www.choices-app.com';
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

/** @deprecated Use CHOICES_CANONICAL_ORIGIN */
export const CHOICES_APEX_ORIGIN = CHOICES_CANONICAL_ORIGIN;
