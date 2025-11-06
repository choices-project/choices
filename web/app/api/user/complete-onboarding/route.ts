import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const supabaseClient = await supabase;

    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      logger.warn('User not authenticated for onboarding completion')
      return NextResponse.redirect(new URL('/login', req.url), { status: 303 })
    }

    // Handle both form data and JSON requests
    const contentType = req.headers.get('content-type')
    let preferences = {}
    
    if (contentType?.includes('application/json')) {
      const body = await req.json()
      preferences = body.preferences ?? {}
    } else {
      // Handle form data
      const formData = await req.formData()
      // Extract preferences from form data if needed
      preferences = {
        notifications: formData.get('notifications') === 'true',
        dataSharing: formData.get('dataSharing') === 'true',
        theme: formData.get('theme') ?? 'system'
      }
    }

    // Update user profile to mark onboarding as completed
    const { error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        preferences: preferences,
        updated_at: new Date().toISOString()
      } as any)
      .eq('user_id', user.id)

    if (updateError) {
      logger.error('Failed to complete onboarding', updateError)
      return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
    }

    // Create response with explicit redirect
    const dest = new URL('/dashboard', req.url).toString() // absolute
    
    // Use 302 for WebKit/Safari, 303 for others (WebKit redirect quirk workaround)
    const userAgent = req.headers.get('user-agent') ?? ''
    const isWebKit = userAgent.includes('WebKit') && !userAgent.includes('Chrome')
    const status = isWebKit ? 302 : 303
    
    const response = NextResponse.redirect(dest, { status })

    // Add explicit headers for WebKit compatibility
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('Content-Length', '0') // help some UA edge cases

    logger.info('Onboarding completed successfully', { userId: user.id })

    return response

  } catch (error) {
    logger.error('Complete onboarding error', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
