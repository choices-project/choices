/** Default destination when no deep link was requested (minimal core v0.1). */
export const DEFAULT_POST_AUTH_PATH = '/polls';

/**
 * First non-empty post-auth path from common query param names on `/auth`.
 *
 * - `redirectTo` — used by middleware and most in-app links
 * - `redirect` — legacy / alternate client links (poll wizard, contact, etc.)
 * - `next` — used by some OAuth/callback flows
 */
export function pickRedirectQueryParam(params: URLSearchParams): string | null {
  for (const key of ['redirectTo', 'redirect', 'next'] as const) {
    const value = params.get(key);
    if (value != null && value.trim() !== '') {
      return value;
    }
  }
  return null;
}

/**
 * Normalize `redirectTo` after successful authentication.
 *
 * `/login` is an alias of the canonical `/auth` sign-in page; using it as a
 * post-login target reloads the same UI and looks like sign-in never completes.
 */
export function normalizePostAuthRedirectPath(candidate: string): string {
  const trimmed = candidate.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/polls';
  }
  if (trimmed.startsWith('/auth')) {
    return '/polls';
  }
  const pathOnly = (trimmed.split('?')[0] ?? '').replace(/\/+$/, '') || '/';
  if (pathOnly === '/login') {
    return '/polls';
  }
  // Archived routes redirect to polls home in minimal core
  const archivedPrefixes = [
    '/feed',
    '/dashboard',
    '/onboarding',
    '/civics',
    '/contact',
    '/admin',
    '/analytics',
    '/e2e',
  ];
  if (archivedPrefixes.some((prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`))) {
    return '/polls';
  }
  return trimmed;
}
