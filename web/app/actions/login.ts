'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

/**
 * @fileoverview Modern Supabase Authentication Login Action
 *
 * Implementation using Supabase native authentication.
 * Handles user login with email and password validation.
 *
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */
export async function loginAction(formData: FormData) {
  logger.info('Modern Supabase login action called');
  logger.debug('FormData entries', Object.fromEntries(formData.entries()));

  // Extract form data
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Get Supabase client
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  // Use Supabase native authentication
  // The Supabase SSR cookie adapter should automatically set cookies when signInWithPassword succeeds
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    logger.error('Authentication error:', authError);
    throw new Error('Invalid email or password');
  }

  if (!authData.user) {
    throw new Error('Authentication failed');
  }

  logger.info('User authenticated successfully', {
    userId: authData.user.id,
    email: authData.user.email,
    hasSession: !!authData.session,
    sessionExpiresAt: authData.session?.expires_at,
  });

  // Verify session cookies will be set
  if (!authData.session) {
    logger.error('No session returned from authentication', { userId: authData.user.id });
    throw new Error('Authentication failed - no session created');
  }

  // Force Supabase SSR to refresh the session to ensure cookies are set via adapter
  // This ensures the cookie adapter's set function is called
  try {
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.getSession();
    if (refreshError) {
      logger.warn('Session refresh after login failed', { error: refreshError.message });
    } else if (refreshedSession) {
      logger.info('Session refreshed successfully, cookies should be set via adapter', {
        userId: authData.user.id,
        hasAccessToken: !!refreshedSession.access_token,
      });
    }
  } catch (refreshErr) {
    logger.warn('Error refreshing session after login', { error: refreshErr instanceof Error ? refreshErr.message : 'Unknown' });
  }

  // Explicitly set session cookies for server actions as backup
  // Supabase SSR cookie adapter should have set cookies via getSession() above,
  // but we also set them manually to ensure they're available
  try {
    const cookieStore = cookies()
    const isProduction = process.env.NODE_ENV === 'production'
    const maxAge = 60 * 60 * 24 * 7 // 7 days

    // Extract project reference from Supabase URL for cookie naming
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || 'default'

    // Supabase SSR uses this cookie name - it stores just the access token, not JSON
    const ssrAuthTokenName = `sb-${projectRef}-auth-token`

    // Supabase SSR stores the access token directly (not as JSON)
    cookieStore.set(ssrAuthTokenName, authData.session.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    })

    // Also set refresh token in separate cookie (Supabase SSR pattern)
    const ssrRefreshTokenName = `sb-${projectRef}-auth-token.refresh`
    cookieStore.set(ssrRefreshTokenName, authData.session.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    })

    // Also set individual token cookies for API route compatibility
    cookieStore.set('sb-access-token', authData.session.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    })

    cookieStore.set('sb-refresh-token', authData.session.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    })

    logger.info('Session cookies set explicitly', {
      userId: authData.user.id,
      ssrAuthTokenName,
      ssrRefreshTokenName,
      hasAccessToken: !!authData.session.access_token,
      hasRefreshToken: !!authData.session.refresh_token,
      secure: isProduction,
      sessionExpiresAt: authData.session.expires_at,
    })
  } catch (cookieError) {
    logger.error('Failed to set session cookies', {
      error: cookieError instanceof Error ? cookieError.message : 'Unknown error',
      userId: authData.user.id,
    })
    // Don't throw - Supabase SSR might have set them via adapter
  }

  // Check if user has completed onboarding based on key fields
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('demographics, primary_concerns, community_focus, participation_style')
    .eq('user_id', authData.user.id)
    .single();

  if (profileError) {
    logger.error('Profile lookup error:', profileError);
    // Continue anyway - user can complete onboarding later
  }

  // Supabase automatically sets session cookies
  // No need for manual session management

  // Check onboarding completion based on presence of key fields
  const isOnboardingCompleted = !!(
    profile?.demographics &&
    profile?.primary_concerns &&
    profile?.community_focus &&
    profile?.participation_style
  );

  // Redirect based on onboarding status
  if (isOnboardingCompleted) {
    logger.info('User has completed onboarding, redirecting to dashboard');
    redirect('/dashboard');
  } else {
    logger.info('User needs onboarding, redirecting to onboarding');
    redirect('/onboarding');
  }
}
