import { createClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'

// Helper function to determine the appropriate redirect destination
async function getRedirectDestination(supabase: any, user: any, requestedRedirect: string) {
  // If user explicitly requested a specific redirect, respect it
  if (requestedRedirect && requestedRedirect !== '/dashboard') {
    return requestedRedirect
  }

  // Check if user has completed onboarding (has a profile)
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      devLog('Error checking user profile:', error)
      // If there's an error checking profile, default to dashboard
      return '/dashboard'
    }

    // If no profile exists, user needs to complete onboarding
    if (!profile) {
      devLog('User has no profile, redirecting to onboarding')
      return '/onboarding'
    }

    // User has completed onboarding, go to dashboard or requested destination
    devLog('User has completed onboarding, redirecting to dashboard')
    return '/dashboard'
  } catch (error) {
    devLog('Error in getRedirectDestination:', error)
    // Fallback to dashboard on any error
    return '/dashboard'
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const _next = searchParams.get('next') ?? '/dashboard'
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    devLog('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      devLog('Supabase client not available in auth callback')
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Authentication service not available')}`
      )
    }

    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        devLog('Session exchange error:', exchangeError)
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
        )
      }

      if (data.session && data.user) {
        devLog('Successfully authenticated user:', data.user.email)
        
        // Determine the appropriate redirect destination
        const finalRedirect = await getRedirectDestination(supabase, data.user, redirectTo)
        
        devLog(`Redirecting user to: ${finalRedirect}`)
        return NextResponse.redirect(`${origin}${finalRedirect}`)
      } else {
        devLog('No session returned from code exchange')
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent('Authentication failed - no session created')}`
        )
      }
    } catch (error) {
      devLog('Unexpected error in auth callback:', error)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Unexpected authentication error')}`
      )
    }
  }

  // No code provided
  devLog('No authentication code provided')
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('No authentication code provided')}`
  )
}
