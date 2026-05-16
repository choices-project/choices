import { normalizePostAuthRedirectPath } from '@/lib/auth/normalize-post-auth-redirect';

/**
 * Full-page navigation after auth. Use when httpOnly cookies were already set on a
 * same-origin API response or by a server redirect (OAuth / verify).
 */
export function navigateAfterAuth(redirectTo: string): void {
  const target = normalizePostAuthRedirectPath(redirectTo);
  if (typeof window !== 'undefined') {
    window.location.assign(target);
  }
}

/** @internal Exported for unit tests (legacy redirect resolution). */
export function resolveSyncSessionNavigation(
  response: Pick<Response, 'type' | 'status' | 'headers'>,
  redirectTo: string,
): { shouldNavigate: boolean; destination: string } {
  const target = normalizePostAuthRedirectPath(redirectTo);
  const locationHeader = response.headers.get('Location');
  const destination =
    locationHeader && locationHeader.length > 0 ? locationHeader : target;

  const isRedirectResponse =
    response.type === 'opaqueredirect' ||
    response.status === 0 ||
    (response.status >= 300 && response.status < 400);

  if (isRedirectResponse) {
    return { shouldNavigate: true, destination };
  }

  if (response.status >= 200 && response.status < 300) {
    return { shouldNavigate: true, destination: target };
  }

  return { shouldNavigate: false, destination: target };
}
