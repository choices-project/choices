/**
 * Simple Admin Authentication
 *
 * This replaces the complex custom middleware with a simple, secure approach.
 * Only the service role (you) can grant admin access.
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { authError } from '@/lib/api';
import logger from '@/lib/utils/logger';

import type { NextResponse } from 'next/server';



export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) return false;
    return profile.is_admin === true;
  } catch (error) {
    logger.error('Admin check error:', error);
    return false;
  }
}

/** Non-throwing: great for APIs and guards */
export async function getAdminUser(): Promise<{ id: string; email?: string } | null> {
  // E2E harness bypass: In test mode with harness enabled, return mock admin user
  // CRITICAL: NEXT_PUBLIC_ vars are available on the server at runtime.
  const harnessEnabled = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

  logger.info('[getAdminUser] Checking admin access', {
    harnessEnabled,
    envVar: process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS,
  });

  if (harnessEnabled) {
    logger.info('[getAdminUser] E2E harness bypass active - returning mock admin user', {
      harnessEnabled,
    });
    return {
      id: 'e2e-admin-user-id',
      email: 'admin@test.com',
    };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Debug logging for CI troubleshooting
  if (process.env.CI === 'true') {
    logger.info('[getAdminUser] Auth check:', {
      hasUser: !!user,
      userId: user?.id?.substring(0, 8),
      authError: authError?.message
    });
  }

    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

  // Debug logging for CI troubleshooting
    if (process.env.CI === 'true') {
      logger.info('[getAdminUser] Profile check:', {
        hasProfile: !!profile,
        isAdmin: profile?.is_admin,
        profileError: error?.message
      });
    }

    if (error || !profile) return null;
    return profile.is_admin ? user : null;
  } catch (error) {
    logger.error('[getAdminUser] Failed to resolve admin user', error);
    return null;
  }
}

/** Throwing variant: great for imperative flows & tests that expect throws */
export async function requireAdminUser(): Promise<any> {
  // E2E harness bypass: In test mode with harness enabled, return mock admin user
  const harnessEnabled = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

  if (harnessEnabled) {
    logger.info('[requireAdminUser] E2E harness bypass active - returning mock admin user', {
      harnessEnabled,
    });
    return {
      id: 'e2e-admin-user-id',
      email: 'admin@test.com',
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  if (error || !profile?.is_admin) throw new Error('Admin access required');

  return user;
}

/** Boolean throw helper retained for backwards-compat */
export async function requireAdmin(): Promise<void> {
  await requireAdminUser(); // will throw if not admin/authenticated
}

/** API helper that returns 401 response instead of throwing */
export async function requireAdminOr401(): Promise<NextResponse | null> {
  // E2E harness bypass: In test mode with harness enabled, allow access
  const harnessEnabled = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

  if (harnessEnabled) {
    logger.info('[requireAdminOr401] E2E harness bypass active - allowing admin access', {
      harnessEnabled,
    });
    return null; // Allow access
  }

  try {
    await requireAdminUser();
    return null;
  } catch {
    return authError('Admin authentication required');
  }
}
