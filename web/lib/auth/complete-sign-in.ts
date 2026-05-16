import {
  applySessionTokensToBrowser,
  hydrateBrowserSessionFromServer,
  type SessionTokens,
} from '@/lib/auth/browser-session';
import { navigateAfterAuth } from '@/lib/auth/post-auth-navigation';

/**
 * Canonical client finish after any sign-in path that set httpOnly cookies on the server.
 * Optionally applies tokens from a JSON login/passkey response, then ensures the browser
 * client is hydrated before a full-page navigation (middleware-safe).
 */
export async function completeSignIn(
  redirectTo: string,
  tokens?: SessionTokens | null,
): Promise<boolean> {
  const session =
    tokens?.access_token && tokens.refresh_token
      ? await applySessionTokensToBrowser(tokens)
      : await hydrateBrowserSessionFromServer();

  if (!session) {
    return false;
  }

  navigateAfterAuth(redirectTo);
  return true;
}
