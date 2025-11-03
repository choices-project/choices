import { type NextRequest, NextResponse } from 'next/server'

import { 
  type JourneyStage, 
  type JourneyMilestone,
  getJourneyChecklist,
  getNextAction,
  shouldSendReminder,
  calculateProgress
} from '@/lib/candidate/journey-tracker'
import { withOptional } from '@/lib/util/objects'
import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

/**
 * GET /api/candidate/journey/progress
 * Get candidate journey progress
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Get current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const platformId = searchParams.get('platformId')

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform ID required' },
        { status: 400 }
      )
    }

    // Get platform
    const { data: platform, error: platformError } = await supabase
      .from('candidate_platforms')
      .select('*')
      .eq('id', platformId)
      .eq('user_id', authUser.id)
      .single()

    if (platformError || !platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      )
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
    const createdDate = new Date(platform.created_at)
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

    return NextResponse.json({
      progress,
      checklist,
      nextAction,
      reminder,
      progressPercent,
      stage: currentStage
    })
  } catch (error) {
    logger.error('Journey progress error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/candidate/journey/progress
 * Update journey progress (checklist item completion, etc.)
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

    const _body = await request.json()
    const { platformId, milestone: _milestone, checklistItemId: _checklistItemId } = _body

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform ID required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const { data: platform } = await supabase
      .from('candidate_platforms')
      .select('user_id')
      .eq('id', platformId)
      .single()

    if (!platform || platform.user_id !== authUser.id) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Update last_active_at
    const { error: updateError } = await supabase
      .from('candidate_platforms')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', platformId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      )
    }

    // In future, could store milestones/checklist in separate table
    // For now, just update last_active_at

    return NextResponse.json({
      success: true,
      message: 'Progress updated'
    })
  } catch (error) {
    logger.error('Update journey progress error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

