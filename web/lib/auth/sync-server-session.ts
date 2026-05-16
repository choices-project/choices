/**
 * Promote the Supabase session from browser cookies into httpOnly response cookies
 * so Edge middleware can authenticate full-page navigations.
 */
export async function syncServerSessionCookies(): Promise<boolean> {
  const response = await fetch('/api/auth/sync-session', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  return response.ok;
}
