import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  if (!token) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('No verification token provided')}`
    )
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  if (!supabase) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Authentication service not available')}`
    )
  }

  try {
    // Handle different verification types
    if (type === 'signup' || type === 'email') {
      // Verify email for signup
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      })

      if (error) {
        console.error('Email verification error:', error)
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent('Email verification failed. Please try signing up again.')}`
        )
      }

      if (data.session) {
        console.log('Email verified successfully for:', data.user?.email)
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
    } else {
      // Try to exchange the token for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(token)
      
      if (error) {
        console.error('Token exchange error:', error)
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent('Verification link expired or invalid. Please try signing up again.')}`
        )
      }

      if (data.session) {
        console.log('Session created successfully for:', data.user?.email)
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
    }

    // If we get here, something went wrong
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Verification failed. Please try again.')}`
    )

  } catch (error) {
    console.error('Unexpected error in verification:', error)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Unexpected error during verification')}`
    )
  }
}
