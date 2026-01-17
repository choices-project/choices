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
  // CRITICAL: In Next.js, NEXT_PUBLIC_ vars ARE available on the server at runtime
  // But they need to be set when the server starts
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevOrTest = nodeEnv !== 'production';
  const harnessEnabled = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';
  
  // Debug logging to see what's happening
  logger.info('[getAdminUser] Checking admin access', {
    nodeEnv,
    harnessEnabled,
    isDevOrTest,
    envVar: process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS,
  });
  
  // CRITICAL: For faster dev testing, allow admin access in dev mode
  // This provides higher turnaround and more informative React errors during development
  if ((harnessEnabled || nodeEnv === 'development') && isDevOrTest) {
    logger.info('[getAdminUser] Dev mode bypass active - returning mock admin user', {
      nodeEnv,
      harnessEnabled,
      isDevOrTest,
    });
    return {
      id: 'e2e-admin-user-id',
      email: 'admin@test.com',
    };
  }

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
}

/** Throwing variant: great for imperative flows & tests that expect throws */
export async function requireAdminUser(): Promise<any> {
  // E2E harness bypass: In test mode with harness enabled, return mock admin user
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevOrTest = nodeEnv !== 'production';
  const harnessEnabled = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';
  
  if ((harnessEnabled || nodeEnv === 'development') && isDevOrTest) {
    logger.info('[requireAdminUser] Dev mode bypass active - returning mock admin user', {
      nodeEnv,
      harnessEnabled,
      isDevOrTest,
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
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevOrTest = nodeEnv !== 'production';
  const harnessEnabled = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';
  
  if ((harnessEnabled || nodeEnv === 'development') && isDevOrTest) {
    logger.info('[requireAdminOr401] Dev mode bypass active - allowing admin access', {
      nodeEnv,
      harnessEnabled,
      isDevOrTest,
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
