import { getSupabaseServerClient } from '@/utils/supabase/server'

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import {
  shouldSendReminder,
  type JourneyStage,
  type JourneyMilestone
} from '@/lib/candidate/journey-tracker'
import { sendCandidateJourneyEmail } from '@/lib/services/email/candidate-journey-emails'
import { logger } from '@/lib/utils/logger'

import type { NextRequest } from 'next/server'


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.CRON_SECRET) {
      return authError('Unauthorized - Invalid cron secret');
    }
  }

  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

    // Get all active candidate platforms
    const { data: platforms, error: platformsError } = await supabase
      .from('candidate_platforms')
      .select(`
        *,
        user_profiles!inner(email)
      `)
      .eq('status', 'active')
      .neq('filing_status', 'verified') // Don't send to verified candidates
      .order('created_at', { ascending: true })

  if (platformsError) {
    logger.error('Failed to fetch platforms:', platformsError instanceof Error ? platformsError : new Error(String(platformsError)))
    return errorResponse('Failed to fetch platforms', 500);
  }

  if (!platforms || platforms.length === 0) {
    return successResponse({
      message: 'No candidates need reminders',
      sent: 0
    });
  }

    const results = {
      checked: platforms.length,
      sent: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{ platformId: string; emailType?: string; reason: string }>
    }

    // Check each platform for reminder needs
    for (const platform of platforms) {
      try {
        // Determine current stage
        let currentStage: JourneyStage = 'declared'
        const milestones: JourneyMilestone[] = []

        // Determine milestones based on platform state
        milestones.push('declaration_complete')
        if (platform.filing_deadline) {
          milestones.push('requirements_reviewed')
        }
        if (platform.official_filing_id) {
          milestones.push('forms_started')
        }
        if (platform.filing_status === 'filed' || platform.filing_status === 'verified') {
          milestones.push('filing_submitted')
        }
        if (platform.filing_status === 'verified' || platform.verified) {
          milestones.push('filing_verified')
        }
        if (platform.status === 'active' && platform.verified) {
          milestones.push('platform_launched')
        }

        if (platform.status === 'active' && platform.verified) {
          currentStage = 'active'
        } else if (platform.filing_status === 'verified') {
          currentStage = 'verified'
        } else if (platform.filing_status === 'filed') {
          currentStage = 'filed'
        } else if (platform.official_filing_id) {
          currentStage = 'filing_in_progress'
        } else if (platform.filing_deadline) {
          currentStage = 'preparing'
        }

        // Calculate progress
        const createdDate = new Date(platform.created_at ?? Date.now())
        const now = new Date()
        const daysSinceDeclaration = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

        let daysUntilDeadline: number | undefined
        if (platform.filing_deadline) {
          const deadlineDate = new Date(platform.filing_deadline)
          daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }

        const baseProgress = {
          platformId: platform.id,
          userId: platform.user_id,
          currentStage,
          milestones,
          lastActiveAt: platform.last_active_at ? new Date(platform.last_active_at) : createdDate,
          daysSinceDeclaration
        };

        const optionalProgress: Record<string, unknown> = {};
        if (daysUntilDeadline !== undefined) {
          optionalProgress.daysUntilDeadline = daysUntilDeadline;
        }

        const progress = { ...baseProgress, ...optionalProgress };

        // Check if reminder needed
        const reminder = shouldSendReminder(progress as typeof baseProgress & { daysUntilDeadline?: number })

        if (!reminder?.shouldSend) {
          results.skipped++
          results.details.push({
            platformId: platform.id,
            reason: 'No reminder needed at this time'
          })
          continue
        }

        // Get user email
        const userProfiles = platform.user_profiles as { email?: string } | null | undefined;
        const email = userProfiles?.email
        if (!email) {
          results.skipped++
          results.details.push({
            platformId: platform.id,
            reason: 'No email address found'
          })
          continue
        }

        // Map reminder type to email type
        const emailTypeMap: Record<string, 'welcome' | 'check_in' | 'deadline_30' | 'deadline_7' | 'deadline_1' | 'verification_prompt'> = {
          welcome: 'welcome',
          check_in: 'check_in',
          deadline_30: 'deadline_30',
          deadline_7: 'deadline_7',
          deadline_1: 'deadline_1',
          verify: 'verification_prompt'
        }

        const emailType = emailTypeMap[reminder.reminderType] ?? 'check_in'

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

        const optionalEmailData: Record<string, unknown> = {};
        if (platform.filing_deadline) {
          optionalEmailData.filingDeadline = new Date(platform.filing_deadline);
        }
        if (daysUntilDeadline !== undefined) {
          optionalEmailData.daysUntilDeadline = daysUntilDeadline;
        }

        const emailData = { ...baseEmailData, ...optionalEmailData };

        // Send email
        const emailResult = await sendCandidateJourneyEmail(emailType, emailData as typeof baseEmailData & { filingDeadline?: Date; daysUntilDeadline?: number })

        if (emailResult.success) {
          // Update last reminder sent
          await supabase
            .from('candidate_platforms')
            .update({
              last_active_at: new Date().toISOString()
            })
            .eq('id', platform.id)

          results.sent++
          results.details.push({
            platformId: platform.id,
            emailType,
            reason: 'Email sent successfully'
          })
        } else {
          results.errors++
          results.details.push({
            platformId: platform.id,
            emailType,
            reason: `Failed to send: ${emailResult.error}`
          })
        }
      } catch (error) {
        logger.error(`Error processing platform ${platform.id}:`, error instanceof Error ? error : new Error(String(error)))
        results.errors++
        results.details.push({
          platformId: platform.id,
          reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }

  return successResponse({
    message: `Processed ${results.checked} candidates`,
    ...results
  });
});

