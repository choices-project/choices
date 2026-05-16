import { normalizePostAuthRedirectPath } from '@/lib/auth/normalize-post-auth-redirect';

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

/**
 * Full-page navigation after auth. Use when httpOnly cookies were already set on a
 * same-origin API response (login, passkey verify) or by a server redirect (OAuth).
 */
export function navigateAfterAuth(redirectTo: string): void {
  const target = normalizePostAuthRedirectPath(redirectTo);
  if (typeof window !== 'undefined') {
    window.location.assign(target);
  }
}

/**
 * Establish httpOnly cookies via POST /api/auth/sync-session, then navigate.
 * Use only when the session exists in the browser/JSON but cookies were not set
 * (e.g. sign-up before email confirmation is disabled).
 */
export async function establishServerSessionAndNavigate(
  session: SessionTokens,
  redirectTo: string,
): Promise<boolean> {
  const target = normalizePostAuthRedirectPath(redirectTo);

  const response = await fetch('/api/auth/sync-session', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      redirectTo: target,
    }),
    redirect: 'manual',
  });

  const { shouldNavigate, destination } = resolveSyncSessionNavigation(response, target);

  if (shouldNavigate) {
    window.location.assign(destination);
    return true;
  }

  return false;
}

/** @internal Exported for unit tests. */
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
