import { normalizePostAuthRedirectPath } from '@/lib/auth/normalize-post-auth-redirect';

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

/**
 * Set httpOnly session cookies on the server and navigate to `redirectTo` in one
 * step (303 redirect + Set-Cookie on the same response).
 */
export async function syncServerSessionAndNavigate(
  session: SessionTokens,
  redirectTo: string,
): Promise<boolean> {
  const target = normalizePostAuthRedirectPath(redirectTo);
  const response = await fetch('/api/auth/sync-session', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      redirectTo: target,
    }),
    redirect: 'manual',
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('Location');
    if (location) {
      window.location.assign(location);
      return true;
    }
  }

  return false;
}
