/**
 * Normalize `redirectTo` after successful authentication.
 *
 * `/login` is an alias of the canonical `/auth` sign-in page; using it as a
 * post-login target reloads the same UI and looks like sign-in never completes.
 */
export function normalizePostAuthRedirectPath(candidate: string): string {
  const trimmed = candidate.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/feed';
  }
  if (trimmed.startsWith('/auth')) {
    return '/feed';
  }
  const pathOnly = (trimmed.split('?')[0] ?? '').replace(/\/+$/, '') || '/';
  if (pathOnly === '/login') {
    return '/feed';
  }
  return trimmed;
}
