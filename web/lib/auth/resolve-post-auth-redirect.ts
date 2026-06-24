
import { devLog } from '@/lib/utils/logger';

import {
  DEFAULT_POST_AUTH_PATH,
  normalizePostAuthRedirectPath,
  pickRedirectQueryParam,
} from './normalize-post-auth-redirect';

import type { SupabaseClient } from '@supabase/supabase-js';

export { DEFAULT_POST_AUTH_PATH };

export type PostAuthRedirectParams = {
  /** Normalized in-app path when the user had an explicit redirect query param. */
  explicitPath: string | null;
};

export function parsePostAuthRedirectFromSearchParams(
  searchParams: URLSearchParams,
): PostAuthRedirectParams {
  const raw = pickRedirectQueryParam(searchParams);
  if (raw == null || raw.trim() === '') {
    return { explicitPath: null };
  }
  return { explicitPath: normalizePostAuthRedirectPath(raw) };
}

/**
 * Choose where to send the user after a successful sign-in.
 *
 * - Explicit `redirectTo` / `redirect` / `next` (already normalized) is always honored.
 * - Otherwise, users without a profile still go to `/polls` in minimal core (onboarding archived).
 */
export async function resolvePostAuthRedirect(
  supabase: SupabaseClient,
  userId: string,
  { explicitPath }: PostAuthRedirectParams,
): Promise<string> {
  if (explicitPath) {
    return explicitPath;
  }

  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      devLog('Error checking user profile for post-auth redirect:', error);
      return DEFAULT_POST_AUTH_PATH;
    }

    if (!profile) {
      devLog('User has no profile; minimal core sends to polls (profile auto-provision may apply)');
    }

    return DEFAULT_POST_AUTH_PATH;
  } catch (error) {
    devLog('Error in resolvePostAuthRedirect:', { error });
    return DEFAULT_POST_AUTH_PATH;
  }
}
