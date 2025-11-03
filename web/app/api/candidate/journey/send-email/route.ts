import { type NextRequest, NextResponse } from 'next/server'

import { 
  sendCandidateJourneyEmail,
  type EmailType 
} from '@/lib/services/email/candidate-journey-emails'
import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

/**
 * POST /api/candidate/journey/send-email
 * Send candidate journey email
 * 
 * Used for:
 * - Manual testing
 * - Scheduled reminders (via cron)
 * - Triggered events (post-declaration, etc.)
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

    // Get current user (for manual sends)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { 
      type, 
      platformId, 
      to, // Optional override
      skipAuth = false // For cron jobs
    } = body

    if (!type || !platformId) {
      return NextResponse.json(
        { error: 'Type and platformId are required' },
        { status: 400 }
      )
    }

    // For manual sends, require auth
    if (!skipAuth && (!authUser || authError)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get platform
    const { data: platform, error: platformError } = await supabase
      .from('candidate_platforms')
      .select(`
        *,
        user_profiles!inner(email)
      `)
      .eq('id', platformId)
      .single()

    if (platformError || !platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      )
    }

    // Verify ownership (unless cron job)
    if (!skipAuth && (!authUser || platform.user_id !== authUser.id)) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Get user email
    const userProfiles = platform.user_profiles as { email?: string } | null | undefined;
    const email = to ?? userProfiles?.email;
    if (!email) {
      return NextResponse.json(
        { error: 'Email address not found' },
        { status: 400 }
      )
    }

    // Prepare email data
    const emailData = {
      to: email,
      candidateName: platform.candidate_name,
      office: platform.office,
      level: platform.level,
      state: platform.state,
      filingDeadline: platform.filing_deadline ? new Date(platform.filing_deadline) : undefined,
      daysUntilDeadline: platform.filing_deadline 
        ? Math.ceil((new Date(platform.filing_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : undefined,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/candidate/dashboard`,
      platformId: platform.id
    }

    // Send email
    const result = await sendCandidateJourneyEmail(type as EmailType, emailData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to send email' },
        { status: 500 }
      )
    }

    // Update last reminder sent timestamp
    await supabase
      .from('candidate_platforms')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', platformId)

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailType: type
    })
  } catch (error) {
    logger.error('Send candidate email error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/candidate/journey/send-email?platformId=...&type=welcome
 * Test endpoint for sending emails
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const platformId = searchParams.get('platformId')
    const type = searchParams.get('type') ?? 'welcome'

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform ID required' },
        { status: 400 }
      )
    }

    // Call POST handler logic
    const mockRequest = {
      json: async () => ({ platformId, type, skipAuth: true })
    } as NextRequest

    return await POST(mockRequest)
  } catch (error) {
    logger.error('Send candidate email GET error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

