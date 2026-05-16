import { cache } from 'react';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import type { User } from '@supabase/supabase-js';

/**
 * Per-request cached auth read. Prefer `getUser()` over `getSession()` on the server
 * so the JWT is validated with Supabase (see Supabase SSR guidance).
 */
export const getServerAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
});

export const getServerAuthSession = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) {
    return null;
  }
  return session;
});
