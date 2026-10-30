import {
  applySessionTokensToBrowser,
  hydrateBrowserSessionFromServer,
  type SessionTokens,
} from '@/lib/auth/browser-session';
import { normalizePostAuthRedirectPath } from '@/lib/auth/normalize-post-auth-redirect';
import { navigateAfterAuth } from '@/lib/auth/post-auth-navigation';
import { syncClientAuthSession } from '@/lib/auth/sync-client-auth-session';

export type CompleteSignInOptions = {
  /** Client navigation so AuthProvider stays mounted across /auth → /polls. */
  navigate?: (path: string) => void;
};

/**
 * Canonical client finish after any sign-in path that set httpOnly cookies on the server.
 * Optionally applies tokens from a JSON login/passkey response, then hydrates the browser
 * client. Prefer `navigate` inside the session shell; full-page assign stays for OAuth/PWA.
 */
export async function completeSignIn(
  redirectTo: string,
  tokens?: SessionTokens | null,
  options?: CompleteSignInOptions,
): Promise<boolean> {
  const session =
    tokens?.access_token && tokens.refresh_token
      ? await applySessionTokensToBrowser(tokens)
      : await hydrateBrowserSessionFromServer();

  if (!session) {
    return false;
  }

  syncClientAuthSession(session);
  const target = normalizePostAuthRedirectPath(redirectTo);
  if (options?.navigate) {
    options.navigate(target);
  } else {
    navigateAfterAuth(target);
  }
  return true;
}
