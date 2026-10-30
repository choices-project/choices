import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import { fetchAuthCsrfToken } from '@/features/auth/lib/csrf-token';

import { logger } from '@/lib/utils/logger';

import type { Session } from '@supabase/supabase-js';

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

type ServerSessionPayload = SessionTokens & {
  user?: Session['user'];
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
};

const SET_SESSION_HARD_TIMEOUT_MS = 2_500;

function sessionFromServerPayload(tokens: ServerSessionPayload): Session | null {
  if (!tokens.user) {
    return null;
  }
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in ?? 0,
    token_type: 'bearer',
    user: tokens.user,
    ...(typeof tokens.expires_at === 'number' ? { expires_at: tokens.expires_at } : {}),
  };
}

async function adoptServerTokens(tokens: ServerSessionPayload): Promise<Session | null> {
  const fallback = sessionFromServerPayload(tokens);
  const supabase = await getSupabaseBrowserClient();
  const setPromise = supabase.auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  const raced = await Promise.race([
    setPromise.then((result) => ({ kind: 'ok' as const, result })),
    new Promise<{ kind: 'timeout' }>((resolve) => {
      setTimeout(() => resolve({ kind: 'timeout' }), SET_SESSION_HARD_TIMEOUT_MS);
    }),
  ]);

  if (raced.kind === 'timeout') {
    logger.warn(
      `adoptServerTokens: setSession() did not resolve within ${SET_SESSION_HARD_TIMEOUT_MS}ms — using server identity for the shell`,
    );
    void setPromise.catch((error) => {
      logger.warn('adoptServerTokens: late setSession failed', { error });
    });
    return fallback;
  }

  if (raced.result.error) {
    logger.warn('adoptServerTokens: setSession failed', {
      message: raced.result.error.message,
    });
    return fallback;
  }

  return raced.result.data.session?.user ? raced.result.data.session : fallback;
}

/**
 * Mirror httpOnly Supabase cookies into the browser client (`setSession`).
 * Required because middleware reads cookies the JS client cannot see until hydrated.
 */
async function fetchSessionFromServer(): Promise<Response> {
  const csrfToken = await fetchAuthCsrfToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return fetch('/api/auth/session', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers,
  });
}

export async function hydrateBrowserSessionFromServer(): Promise<Session | null> {
  try {
    let res = await fetchSessionFromServer();
    // PWA service worker can briefly return 503 on transient fetch failures.
    if (res.status === 503) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      res = await fetchSessionFromServer();
    }
    if (!res.ok) {
      return null;
    }
    const body = (await res.json()) as {
      data?: { session?: SessionTokens & { user?: Session['user'] } };
    };
    const tokens = body.data?.session;
    if (!tokens?.access_token || !tokens.refresh_token) {
      return null;
    }
    const fallback = sessionFromServerPayload(tokens);
    return Promise.race([
      adoptServerTokens(tokens),
      new Promise<Session | null>((resolve) => {
        setTimeout(() => resolve(fallback), SET_SESSION_HARD_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    logger.warn('hydrateBrowserSessionFromServer failed', { error });
    return null;
  }
}

export async function applySessionTokensToBrowser(
  tokens: SessionTokens & { user?: Session['user'] },
): Promise<Session | null> {
  return adoptServerTokens(tokens);
}
