import { NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  parsePostAuthRedirectFromSearchParams,
  resolvePostAuthRedirect,
} from '@/lib/auth/resolve-post-auth-redirect';
import { devLog } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const postAuthParams = parsePostAuthRedirectFromSearchParams(searchParams)

  if (!token) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent('No verification token provided')}`
    )
  }

  const supabase = getSupabaseServerClient()

  try {
    const supabaseClient = await supabase;

    const redirectAfterSession = async (userId: string) => {
      const finalRedirect = await resolvePostAuthRedirect(
        supabaseClient,
        userId,
        postAuthParams,
      )
      return NextResponse.redirect(`${origin}${finalRedirect}`)
    };

    // Handle different verification types
    if (type === 'signup' || type === 'email') {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      })

      if (error) {
        devLog('Email verification error:', { error })
        return NextResponse.redirect(
          `${origin}/auth?error=${encodeURIComponent('Email verification failed. Please try signing up again.')}`
        )
      }

      if (data.session && data.user) {
        devLog('Email verified successfully for:', { email: data.user.email })
        return redirectAfterSession(data.user.id)
      }
    } else {
      const { data, error } = await supabaseClient.auth.exchangeCodeForSession(token)

      if (error) {
        devLog('Token exchange error:', { error })
        return NextResponse.redirect(
          `${origin}/auth?error=${encodeURIComponent('Verification link expired or invalid. Please try signing up again.')}`
        )
      }

      if (data.session && data.user) {
        devLog('Session created successfully for:', { email: data.user.email })
        return redirectAfterSession(data.user.id)
      }
    }

    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent('Verification failed. Please try again.')}`
    )
  } catch (error) {
    devLog('Unexpected error in verification:', { error })
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent('Unexpected error during verification')}`
    )
  }
}
