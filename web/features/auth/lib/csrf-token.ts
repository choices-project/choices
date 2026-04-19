/**
 * Shared CSRF token fetch for browser calls to state-changing /api/auth/* and WebAuthn routes.
 */

export async function fetchAuthCsrfToken(fetcher: typeof fetch = fetch): Promise<string | null> {
  try {
    const response = await fetcher('/api/auth/csrf', {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json().catch(() => null);
    return data?.data?.csrfToken ?? null;
  } catch {
    return null;
  }
}
