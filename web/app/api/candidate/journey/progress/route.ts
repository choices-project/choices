import { type NextRequest } from 'next/server'

import { 
  type JourneyStage, 
  type JourneyMilestone,
  getJourneyChecklist,
  getNextAction,
  shouldSendReminder,
  calculateProgress
} from '@/lib/candidate/journey-tracker'
import { withErrorHandling, successResponse, authError, errorResponse, validationError, notFoundError, forbiddenError } from '@/lib/api';
import { withOptional } from '@/lib/util/objects'
import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !authUser) {
    return authError('Authentication required');
  }

  const searchParams = request.nextUrl.searchParams
  const platformId = searchParams.get('platformId')

  if (!platformId) {
    return validationError({ platformId: 'Platform ID required' });
  }

    // Get platform
    const { data: platform, error: platformError } = await supabase
      .from('candidate_platforms')
      .select('*')
      .eq('id', platformId)
      .eq('user_id', authUser.id)
      .single()

  if (platformError || !platform) {
    return notFoundError('Platform not found');
  }

    // Determine current stage
    let currentStage: JourneyStage = 'declared'
    const milestones: JourneyMilestone[] = []

    if (platform.status === 'active' && platform.verified) {
      currentStage = 'active'
      milestones.push('platform_launched')
    } else if (platform.filing_status === 'verified') {
      currentStage = 'verified'
      milestones.push('filing_verified')
    } else if (platform.filing_status === 'filed') {
      currentStage = 'filed'
      milestones.push('filing_submitted')
    } else if (platform.official_filing_id) {
      currentStage = 'filing_in_progress'
      milestones.push('forms_started')
    } else if (platform.created_at) {
      // Check if they've reviewed requirements (has filing deadline set)
      if (platform.filing_deadline) {
        currentStage = 'preparing'
        milestones.push('requirements_reviewed')
      } else {
        currentStage = 'declared'
      }
    }

    milestones.push('declaration_complete')

    // Calculate dates
    const createdDate = new Date(platform.created_at ?? Date.now())
    const now = new Date()
    const daysSinceDeclaration = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    
    let daysUntilDeadline: number | undefined
    if (platform.filing_deadline) {
      const deadlineDate = new Date(platform.filing_deadline)
      daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Build progress object with proper optional handling
    const progress = withOptional({
      platformId: platform.id,
      userId: authUser.id,
      currentStage,
      milestones,
      lastActiveAt: platform.last_active_at ? new Date(platform.last_active_at) : createdDate,
      daysSinceDeclaration
    }, {
      nextActionDue: platform.filing_deadline ? new Date(platform.filing_deadline) : undefined,
      daysUntilDeadline
    })

    // Get checklist
    const checklist = getJourneyChecklist(currentStage)

    // Get next action
    const nextAction = getNextAction(progress)

    // Check if reminder needed
    const reminder = shouldSendReminder(progress)

    // Calculate progress
    const progressPercent = calculateProgress(progress, checklist)

  return successResponse({
    progress,
    checklist,
    nextAction,
    reminder,
    progressPercent,
    stage: currentStage
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !authUser) {
    return authError('Authentication required');
  }

  const _body = await request.json()
  const { platformId, milestone: _milestone, checklistItemId: _checklistItemId } = _body

  if (!platformId) {
    return validationError({ platformId: 'Platform ID required' });
  }

  const { data: platform } = await supabase
    .from('candidate_platforms')
    .select('user_id')
    .eq('id', platformId)
    .single()

  if (!platform || platform.user_id !== authUser.id) {
    return forbiddenError('Not authorized');
  }

  const { error: updateError } = await supabase
    .from('candidate_platforms')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', platformId)

  if (updateError) {
    return errorResponse('Failed to update progress', 500);
  }

  return successResponse({
    message: 'Progress updated'
  });
});

