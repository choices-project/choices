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

  // Explicitly set session cookies for server actions
  // Supabase SSR should handle this via cookie adapter, but we ensure it works
  // We set both the Supabase SSR cookie names AND the custom names for compatibility
  try {
    const cookieStore = cookies()
    const isProduction = process.env.NODE_ENV === 'production'
    const maxAge = 60 * 60 * 24 * 7 // 7 days

    // Extract project reference from Supabase URL for cookie naming
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || 'default'
    
    // Supabase SSR uses these cookie names
    const ssrAccessTokenName = `sb-${projectRef}-auth-token`
    const ssrRefreshTokenName = `sb-${projectRef}-auth-token.refresh`

    // Set Supabase SSR cookie names (what createServerClient expects)
    cookieStore.set(ssrAccessTokenName, authData.session.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    })

    cookieStore.set(ssrRefreshTokenName, authData.session.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    })

    // Also set custom cookie names for API route compatibility
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
      ssrAccessTokenName,
      ssrRefreshTokenName,
      hasAccessToken: !!authData.session.access_token,
      hasRefreshToken: !!authData.session.refresh_token,
      secure: isProduction,
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