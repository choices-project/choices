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
  const code = searchParams.get('code')
  const postAuthParams = parsePostAuthRedirectFromSearchParams(searchParams)
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    devLog('OAuth error:', { error, errorDescription })
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(errorDescription ?? error)}`
    )
  }

  if (code) {
    const supabase = getSupabaseServerClient()

    try {
      const supabaseClient = await supabase;
      const { data, error: exchangeError } = await supabaseClient.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        devLog('Session exchange error:', { error: exchangeError })
        return NextResponse.redirect(
          `${origin}/auth?error=${encodeURIComponent(exchangeError.message)}`
        )
      }

      if (data.session && data.user) {
        devLog('Successfully authenticated user:', { email: data.user.email })

        const finalRedirect = await resolvePostAuthRedirect(
          supabaseClient,
          data.user.id,
          postAuthParams,
        )

        devLog(`Redirecting user to: ${finalRedirect}`, { redirectTo: finalRedirect })
        return NextResponse.redirect(`${origin}${finalRedirect}`)
      }

      devLog('No session returned from code exchange', {})
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent('Authentication failed - no session created')}`
      )
    } catch (error) {
      devLog('Unexpected error in auth callback:', { error })
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent('Unexpected authentication error')}`
      )
    }
  }

  // No code provided
  devLog('No authentication code provided')
  return NextResponse.redirect(
    `${origin}/auth?error=${encodeURIComponent('No authentication code provided')}`
  )
}
