import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import { logger } from '@/lib/utils/logger';

import type { Session } from '@supabase/supabase-js';

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

/**
 * Mirror httpOnly Supabase cookies into the browser client (`setSession`).
 * Required because middleware reads cookies the JS client cannot see until hydrated.
 */
async function fetchSessionFromServer(): Promise<Response> {
  return fetch('/api/auth/session', {
    credentials: 'include',
    cache: 'no-store',
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
      data?: { session?: SessionTokens };
    };
    const tokens = body.data?.session;
    if (!tokens?.access_token || !tokens.refresh_token) {
      return null;
    }
    const supabase = await getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    if (error) {
      logger.warn('hydrateBrowserSessionFromServer: setSession failed', {
        message: error.message,
      });
      return null;
    }
    return data.session ?? null;
  } catch (error) {
    logger.warn('hydrateBrowserSessionFromServer failed', { error });
    return null;
  }
}

export async function applySessionTokensToBrowser(
  tokens: SessionTokens,
): Promise<Session | null> {
  const supabase = await getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
  if (error) {
    logger.warn('applySessionTokensToBrowser: setSession failed', {
      message: error.message,
    });
    return null;
  }
  return data.session ?? null;
}
