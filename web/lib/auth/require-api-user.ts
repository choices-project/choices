import { getSupabaseServerClient } from '@/utils/supabase/server';

import { authError } from '@/lib/api';

import type { User } from '@supabase/supabase-js';
import type { NextResponse } from 'next/server';

/**
 * Resolve the current user via `getUser()` (JWT validated with Supabase).
 * Prefer this over `getSession()` for authorization decisions in API routes.
 */
export async function requireApiUser(): Promise<
  { user: User; supabase: Awaited<ReturnType<typeof getSupabaseServerClient>> } | NextResponse
> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return authError('Database connection not available');
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return authError('Authentication required');
  }

  return { user, supabase };
}
