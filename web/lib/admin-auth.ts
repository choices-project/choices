/**
 * Simple Admin Authentication
 * 
 * This replaces the complex custom middleware with a simple, secure approach.
 * Only the service role (you) can grant admin access.
 */

import { NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/utils/supabase/server';

export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    return (profile as any)?.is_admin === true;
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}

/** Non-throwing: great for APIs and guards */
export async function getAdminUser(): Promise<any | null> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();
  
  if (!(profile as any)?.is_admin) return null;

  return user;
}

/** Throwing variant: great for imperative flows & tests that expect throws */
export async function requireAdminUser(): Promise<any> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();
  
  if (!(profile as any)?.is_admin) throw new Error('Admin access required');

  return user;
}

/** Boolean throw helper retained for backwards-compat */
export async function requireAdmin(): Promise<void> {
  await requireAdminUser(); // will throw if not admin/authenticated
}

/** API helper that returns 401 response instead of throwing */
export async function requireAdminOr401(): Promise<NextResponse | null> {
  try {
    await requireAdminUser();
    return null;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
