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

    const { data: isAdminUser, error: adminError } = await supabase.rpc('is_admin', { input_user_id: user.id });
    if (adminError) return false;

    return isAdminUser === true;
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}

/** Non-throwing: great for APIs and guards */
export async function getAdminUser(): Promise<{ id: string; email?: string } | null> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdminUser, error } = await supabase.rpc('is_admin', { input_user_id: user.id });
  if (error || !isAdminUser) return null;

  return user;
}

/** Throwing variant: great for imperative flows & tests that expect throws */
export async function requireAdminUser(): Promise<any> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: isAdminUser, error } = await supabase.rpc('is_admin', { input_user_id: user.id });
  if (error || !isAdminUser) throw new Error('Admin access required');

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
