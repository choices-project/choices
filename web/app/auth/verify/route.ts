import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

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
  const nextRequest = new NextRequest(request)

  if (!token) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent('No verification token provided')}`
    )
  }

  try {
    const bootstrapClient = await getSupabaseApiRouteClient(
      nextRequest,
      new NextResponse(),
    )

    if (type === 'signup' || type === 'email') {
      const { data, error } = await bootstrapClient.auth.verifyOtp({
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
        const finalRedirect = await resolvePostAuthRedirect(
          bootstrapClient,
          data.user.id,
          postAuthParams,
        )
        const redirectResponse = NextResponse.redirect(`${origin}${finalRedirect}`)
        const client = await getSupabaseApiRouteClient(nextRequest, redirectResponse)
        await client.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        return redirectResponse
      }
    } else {
      const { data, error } = await bootstrapClient.auth.exchangeCodeForSession(token)

      if (error) {
        devLog('Token exchange error:', { error })
        return NextResponse.redirect(
          `${origin}/auth?error=${encodeURIComponent('Verification link expired or invalid. Please try signing up again.')}`
        )
      }

      if (data.session && data.user) {
        devLog('Session created successfully for:', { email: data.user.email })
        const finalRedirect = await resolvePostAuthRedirect(
          bootstrapClient,
          data.user.id,
          postAuthParams,
        )
        const redirectResponse = NextResponse.redirect(`${origin}${finalRedirect}`)
        const client = await getSupabaseApiRouteClient(nextRequest, redirectResponse)
        await client.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        return redirectResponse
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
