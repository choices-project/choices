import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { devLog } from '@/lib/logger'
import { getCurrentUser } from '@/lib/core/auth/utils'
import { HybridVotingService } from '@/lib/core/services/hybrid-voting'
import { AnalyticsService } from '@/lib/core/services/analytics'
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError, 
  handleError, 
  getUserMessage, 
  getHttpStatus 
} from '@/lib/error-handler'

export const dynamic = 'force-dynamic';

// POST /api/polls/[id]/vote - Submit a vote (authenticated users only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    devLog('Vote submission attempt for poll:', params.id)
    
    const pollId = params.id

    if (!pollId) {
      throw new ValidationError('Poll ID is required')
    }

    const supabase = await getSupabaseServerClient()
    
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    // Check authentication
    const user = getCurrentUser(request)
    if (!user) {
      throw new AuthenticationError('Authentication required to vote')
    }

    const supabaseClient = supabase;
    
    // Verify user is active
    const { data: userProfile } = await supabaseClient
      .from('ia_users')
      .select('is_active')
      .eq('stable_id', user.userId as any)
      .single()

    if (!userProfile || !('is_active' in userProfile) || !userProfile.is_active) {
      throw new AuthenticationError('Active account required to vote')
    }

    const body = await request.json()
    const { choice, privacy_level = 'public' } = body

    // Validate choice
    if (!choice || typeof choice !== 'number' || choice < 1) {
      throw new ValidationError('Valid choice is required')
    }

    // Use hybrid voting service
    const votingService = new HybridVotingService()
    const voteRequest = {
      pollId,
      choice,
      privacyLevel: privacy_level,
      userId: user.userId
    }

    const response = await votingService.submitVote(voteRequest)

    if (!response.success) {
      if (response.message.includes('not found') || response.message.includes('Poll not found')) {
        throw new NotFoundError('Poll not found')
      }
      throw new Error(response.message)
    }

    // Record analytics for the vote
    try {
      const analyticsService = AnalyticsService.getInstance()
      await analyticsService.recordPollAnalytics(user.userId, pollId)
    } catch (analyticsError) {
      devLog('Analytics recording failed for vote:', analyticsError)
      // Don't fail the vote if analytics fails
    }

    return NextResponse.json({
      success: true,
      message: response.message,
      poll_id: pollId,
      privacy_level: response.privacyLevel,
      response_time: response.responseTime,
      audit_receipt: response.auditReceipt,
      vote_confirmed: true
    })

  } catch (error) {
    const appError = handleError(error as Error)
    const userMessage = getUserMessage(appError)
    const statusCode = getHttpStatus(appError)
    
    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    )
  }
}

// GET /api/polls/[id]/vote - Check if user has voted (returns boolean only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id

    if (!pollId) {
      throw new ValidationError('Poll ID is required')
    }

    const supabase = await getSupabaseServerClient()
    
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    // Check authentication
    const user = getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { has_voted: false },
        { status: 200 }
      )
    }

    // Check if user has voted (returns boolean only, no vote data)
    const { data: existingVote } = await supabase
      .from('po_votes')
      .select('id')
      .eq('poll_id', pollId as any)
      .eq('user_id', user.userId as any)
      .single()

    return NextResponse.json({
      has_voted: !!existingVote,
      // Do NOT return any vote details for privacy
    })

  } catch (error) {
    const appError = handleError(error as Error)
    const userMessage = getUserMessage(appError)
    const statusCode = getHttpStatus(appError)
    
    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    )
  }
}
