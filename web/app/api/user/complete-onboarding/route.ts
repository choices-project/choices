import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { cookies as _cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { logger } from '@/lib/logger'
import { setSessionTokenInResponse } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }
    // Get current user from session
    const sessionToken = req.cookies.get('choices_session')?.value
    
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', req.url), { status: 303 })
    }

    let decodedToken
    try {
      decodedToken = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any
    } catch (error) {
      logger.error('Invalid session token', error instanceof Error ? error : new Error('Unknown error'))
      return NextResponse.redirect(new URL('/login', req.url), { status: 303 })
    }

    const { stableId } = decodedToken

    // Handle both form data and JSON requests
    const contentType = req.headers.get('content-type')
    let preferences = {}
    
    if (contentType?.includes('application/json')) {
      const body = await req.json()
      preferences = body.preferences || {}
    } else {
      // Handle form data
      const formData = await req.formData()
      // Extract preferences from form data if needed
      preferences = {
        notifications: formData.get('notifications') === 'true',
        dataSharing: formData.get('dataSharing') === 'true',
        theme: formData.get('theme') || 'system'
      }
    }

    // Update user profile to mark onboarding as completed
    const supabaseClient = await supabase;
    const { error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        preferences: preferences,
        updated_at: new Date().toISOString()
      } as any)
      .eq('user_id', stableId)

    if (updateError) {
      logger.error('Failed to complete onboarding', updateError)
      return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
    }

    // Create updated session token
    const updatedSessionToken = jwt.sign(
      {
        userId: decodedToken.userId,
        stableId,
        username: decodedToken.username,
        onboardingCompleted: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      },
      process.env.JWT_SECRET!
    )

    // Create response with explicit redirect
    const dest = new URL('/dashboard', req.url).toString() // absolute
    
    // Use 302 for WebKit/Safari, 303 for others (WebKit redirect quirk workaround)
    const userAgent = req.headers.get('user-agent') || ''
    const isWebKit = userAgent.includes('WebKit') && !userAgent.includes('Chrome')
    const status = isWebKit ? 302 : 303
    
    const response = NextResponse.redirect(dest, { status })

    // Set updated session cookie
    setSessionTokenInResponse(updatedSessionToken, response)

    // Add explicit headers for WebKit compatibility
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('Content-Length', '0') // help some UA edge cases

    logger.info('Onboarding completed successfully', { stableId })

    return response

  } catch (error) {
    logger.error('Complete onboarding error', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
