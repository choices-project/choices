import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { getUser } from '@/lib/core/auth/middleware'
// import { HybridVotingService } from '@/lib/core/services/hybrid-voting'
import { AnalyticsService } from '@/lib/core/services/analytics'
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError, 
  handleError, 
  getUserMessage, 
  getHttpStatus 
} from '@/lib/error-handler'
import { devLog } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic';


// POST /api/polls/[id]/vote - Submit a vote (authenticated users only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pollId = id;
    devLog('Vote submission attempt for poll:', { pollId })
    devLog('POST vote API called with pollId:', { pollId });

    if (!pollId) {
      throw new ValidationError('Poll ID is required')
    }

    // E2E tests should use real authentication - no bypasses needed
    const supabase = await getSupabaseServerClient();
    
    // Always require real authentication
    let user;
    try {
      user = await getUser();
    } catch (error) {
      console.error('Authentication error during vote:', error);
      throw new AuthenticationError('Authentication required to vote')
    }

    // Check if user is authenticated
    if (!user) {
      throw new AuthenticationError('Authentication required to vote')
    }

    const supabaseClient = supabase;
    
    // Verify user is active - always check for real users
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('is_active')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || !('is_active' in userProfile) || !userProfile.is_active) {
      throw new AuthenticationError('Active account required to vote')
    }

    const body = await request.json()
    const { choice, approvals, selections, privacy_level = 'public' } = body


    // Get poll data to determine voting method
    const { data: pollData } = await supabaseClient
      .from('polls')
      .select('voting_method')
      .eq('id', pollId)
      .single()

    if (!pollData) {
      throw new NotFoundError('Poll not found')
    }


    // Validate vote data based on voting method
    if (pollData.voting_method === 'approval') {
      if (!approvals || !Array.isArray(approvals) || approvals.length === 0) {
        throw new ValidationError('At least one approval is required for approval voting')
      }
    } else if (pollData.voting_method === 'multiple') {
      if (!selections || !Array.isArray(selections) || selections.length === 0) {
        throw new ValidationError('At least one selection is required for multiple choice voting')
      }
    } else {
      if (!choice || typeof choice !== 'number' || choice < 1) {
        throw new ValidationError('Valid choice is required')
      }
    }

    // Handle approval voting differently
    if (pollData.voting_method === 'approval') {
      // For approval voting, store the approvals in vote_data
      const { error: voteError } = await supabaseClient
        .from('votes')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          choice: approvals.length, // Number of approvals
          voting_method: 'approval',
          vote_data: { approvals },
          is_verified: true
        })

      if (voteError) {
        devLog('Error storing approval vote:', { error: voteError.message })
        throw new Error('Failed to submit approval vote')
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Approval vote submitted successfully',
        pollId,
        voteId: 'approval-vote',
        privacyLevel: privacy_level,
        responseTime: Date.now() - Date.now()
      })
    } else if (pollData.voting_method === 'multiple') {
      // For multiple choice voting, store the selections in vote_data
      const { error: voteError } = await supabaseClient
        .from('votes')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          choice: selections.length, // Number of selections
          voting_method: 'multiple',
          vote_data: { selections },
          is_verified: true
        })

      if (voteError) {
        devLog('Error storing multiple choice vote:', { error: voteError.message })
        throw new Error('Failed to submit multiple choice vote')
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Multiple choice vote submitted successfully',
        pollId,
        voteId: 'multiple-choice-vote',
        privacyLevel: privacy_level,
        responseTime: Date.now() - Date.now()
      })
    } else {
      // Hybrid voting service temporarily disabled
      throw new Error('Advanced voting methods temporarily disabled')
    }

    // Record analytics for the vote
    try {
      const analyticsService = AnalyticsService.getInstance()
      await analyticsService.recordPollAnalytics(user.id, pollId)
    } catch (analyticsError: any) {
      const errorMessage = analyticsError instanceof Error ? analyticsError.message : String(analyticsError);
      devLog('Analytics recording failed for vote:', { error: errorMessage });
      // Don't fail the vote if analytics fails
    }

    return NextResponse.json({
      success: true,
      message: 'Vote submitted successfully',
      poll_id: pollId,
      privacy_level,
      response_time: Date.now(),
      audit_receipt: 'vote-receipt',
      vote_confirmed: true
    })

  } catch (error) {
    console.error('POST Vote API error:', error);
    console.error('Error stack:', (error as Error).stack);
    
    // Simple error response for debugging
    return NextResponse.json(
      { 
        error: 'Debug error',
        details: (error as Error).message,
        stack: (error as Error).stack
      },
      { status: 500 }
    )
  }
}

// HEAD /api/polls/[id]/vote - Check if user has voted (returns boolean only)
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pollId = id

    if (!pollId) {
      return new NextResponse(null, { status: 204 }) // Not voted
    }

    // Always use regular client - no E2E bypasses
    const supabase = await getSupabaseServerClient();

    // Get user - always require real authentication
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    
    if (!user) {
      return new NextResponse(null, { status: 204 }) // unauth => not voted
    }

    // Fast existence check: head + count (no rows)
    const { error, count } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('poll_id', pollId)
      .eq('user_id', user.id)

    if (error) {
      // Don't crash SSR — log server-side if you want, but return 204
      return new NextResponse(null, { status: 204 })
    }

    return new NextResponse(null, { 
      status: count && count > 0 ? 200 : 204 
    })

  } catch {
    // Absolutely never throw in HEAD — prevent stream aborts
    return new NextResponse(null, { status: 204 })
  }
}

// GET /api/polls/[id]/vote - Check if user has voted (returns boolean only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pollId = id

    if (!pollId) {
      throw new ValidationError('Poll ID is required')
    }

    const supabase = await getSupabaseServerClient()
    
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    // Always require real authentication - no E2E bypasses
    const user = await getUser()
    
    if (!user) {
      return NextResponse.json(
        { has_voted: false },
        { status: 200 }
      )
    }

    // Check if user has voted (returns boolean only, no vote data)
    const { data: existingVote, error: voteError } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .maybeSingle()

    // If there's an error or no vote found, user hasn't voted
    const hasVoted = !voteError && !!existingVote

    return NextResponse.json({
      has_voted: hasVoted,
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
