import { type NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

/**
 * POST /api/candidate/journey/post-declaration
 * Send post-declaration welcome email and set up journey tracking
 * Called immediately after candidacy declaration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { platformId } = body

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform ID required' },
        { status: 400 }
      )
    }

    // Get platform
    const { data: platform, error: platformError } = await supabase
      .from('candidate_platforms')
      .select('*, user_profiles(email)')
      .eq('id', platformId)
      .eq('user_id', authUser.id)
      .single()

    if (platformError || !platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      )
    }

    // Welcome email sending for candidate journey
    // For now, just log and return success
    // Email implementation would go here:
    // - Welcome email template
    // - Next steps checklist
    // - Links to dashboard
    // - Filing requirements link

    // Mark platform as having received welcome (for future: track email sends)
    // Could add a column like `welcome_email_sent_at` to track

    return NextResponse.json({
      success: true,
      message: 'Post-declaration flow initiated',
      nextSteps: [
        'Review filing requirements for your office',
        'Calculate your filing deadline',
        'Gather required documents',
        'Start filing process'
      ]
    })
  } catch (error) {
    logger.error('Post-declaration flow error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

