import { fetchAuthCsrfToken } from '@/features/auth/lib/csrf-token';

/**
 * Clears httpOnly Supabase cookies via POST /api/auth/logout (CSRF-protected),
 * then navigates to the marketing home.
 */
export async function completeServerLogout(): Promise<void> {
  const csrfToken = await fetchAuthCsrfToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers,
    });
  } catch {
    // Still redirect home; user may need /clear-session if cookies linger.
  }

  window.location.replace('/?loggedOut=1');
}

/**
 * Debug / recovery flow: POST clear-session (CSRF) after local storage wipe.
 */
export async function completeServerClearSession(): Promise<void> {
  const csrfToken = await fetchAuthCsrfToken();
  const headers: HeadersInit = {};
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  try {
    const res = await fetch('/api/auth/clear-session', {
      method: 'POST',
      credentials: 'include',
      headers,
      redirect: 'manual',
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      window.location.replace(location ?? '/?loggedOut=1');
      return;
    }
  } catch {
    // fall through
  }

  window.location.replace('/?loggedOut=1');
}
