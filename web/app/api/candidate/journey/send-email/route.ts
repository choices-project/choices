import type { NextRequest } from 'next/server'

import { 
  sendCandidateJourneyEmail,
  type EmailType 
} from '@/lib/services/email/candidate-journey-emails'
import { withErrorHandling, successResponse, authError, errorResponse, validationError, notFoundError } from '@/lib/api';
import { withOptional } from '@/lib/util/objects'
import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
  
  const body = await request.json()
  const { 
    type, 
    platformId, 
    to,
    skipAuth = false
  } = body

  if (!type || !platformId) {
    return validationError({
      type: !type ? 'Type is required' : '',
      platformId: !platformId ? 'Platform ID is required' : ''
    });
  }

  if (!skipAuth && (!authUser || userError)) {
    return authError('Authentication required');
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
    const baseEmailData = {
      to: email,
      candidateName: platform.candidate_name,
      office: platform.office,
      level: platform.level as 'federal' | 'state' | 'local',
      state: platform.state,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/candidate/dashboard`,
      platformId: platform.id
    };

    const optionalData: Record<string, unknown> = {};
    if (platform.filing_deadline) {
      optionalData.filingDeadline = new Date(platform.filing_deadline);
      optionalData.daysUntilDeadline = Math.ceil(
        (new Date(platform.filing_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
    }

    const emailData = withOptional(baseEmailData, optionalData);

    // Send email
    const result = await sendCandidateJourneyEmail(type as EmailType, emailData as typeof baseEmailData & { filingDeadline?: Date; daysUntilDeadline?: number })

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

