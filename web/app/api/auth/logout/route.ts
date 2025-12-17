import { getSupabaseServerClient } from '@/utils/supabase/server'

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger'

export const POST = withErrorHandling(async () => {
  const supabase = getSupabaseServerClient()
  const supabaseClient = await supabase

  // Sign out with Supabase Auth
  const { error } = await supabaseClient.auth.signOut()

  if (error) {
    logger.warn('Logout error', { error: error.message })
    return errorResponse('Logout failed', 500);
  }

  logger.info('User logged out successfully')

  // Create response
  const response = successResponse({
    message: 'Logged out successfully'
  })

  // Clear Supabase session cookies
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieDomain = isProduction ? '.choices-app.com' : undefined

  response.cookies.set('sb-access-token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    domain: cookieDomain // Clear cookies across www and non-www
  })

  response.cookies.set('sb-refresh-token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    domain: cookieDomain // Clear cookies across www and non-www
  })

  response.cookies.set('sb-session-expires', '', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    domain: cookieDomain // Clear cookies across www and non-www
  })

  return response
});
