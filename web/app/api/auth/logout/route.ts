import {
  validateCsrfProtection,
  createCsrfErrorResponse,
} from '@/app/api/auth/_shared';
import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { env } from '@/lib/config/env';
import { logger } from '@/lib/utils/logger'

import type { NextRequest } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!(await validateCsrfProtection(request))) {
    return createCsrfErrorResponse();
  }

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

  // Clear Supabase session cookies (project-ref and chunked variants included)
  const isProduction = process.env.NODE_ENV === 'production'
  const hostname = request.headers.get('host') || ''
  const isProductionDomain = hostname.includes('choices-app.com')
  const cookieDomain = isProduction && isProductionDomain ? '.choices-app.com' : undefined
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || ''
  const projectRefMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.(co|io)/)
  const projectRef = projectRefMatch ? projectRefMatch[1] : null

  const discoveredCookieNames = new Set<string>([
    'sb-access-token',
    'sb-refresh-token',
    'sb-session-expires',
  ])
  if (projectRef) {
    discoveredCookieNames.add(`sb-${projectRef}-auth-token`)
  }

  // Use both parsed cookies and raw header to catch chunked auth cookies.
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      discoveredCookieNames.add(cookie.name)
    }
  })
  const header = request.headers.get('cookie') || ''
  const matches = header.matchAll(/(?:^|;\s*)(sb-[^=;]+)=/g)
  for (const match of matches) {
    if (match[1]) {
      discoveredCookieNames.add(match[1].trim())
    }
  }

  const clearCookie = (name: string) => {
    // Clear both httpOnly and non-httpOnly variants defensively.
    const common = {
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
    }
    response.cookies.set(name, '', {
      ...common,
      httpOnly: true,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    })
    response.cookies.set(name, '', {
      ...common,
      httpOnly: false,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    })
  }

  for (const cookieName of discoveredCookieNames) {
    clearCookie(cookieName)
  }

  return response
});
