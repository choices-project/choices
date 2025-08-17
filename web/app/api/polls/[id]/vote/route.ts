import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to create Supabase client' },
        { status: 500 }
      )
    }

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rankings, votingMethod } = body

    // Validate poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('po_polls')
      .select('*')
      .eq('poll_id', pollId)
      .eq('status', 'active')
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found or not active' },
        { status: 404 }
      )
    }

    // Check if user has already voted
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('po_votes')
      .select('*')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .single()

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to check existing vote' },
        { status: 500 }
      )
    }

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted in this poll' },
        { status: 400 }
      )
    }

    // Validate rankings for ranked choice voting
    if (votingMethod === 'ranked') {
      if (!rankings || typeof rankings !== 'object') {
        return NextResponse.json(
          { error: 'Invalid rankings data' },
          { status: 400 }
        )
      }

      const pollOptions = poll.options || []
      const rankedOptions = Object.values(rankings).filter((r: any) => r > 0)
      
      // Check that all options are ranked
      if (rankedOptions.length !== pollOptions.length) {
        return NextResponse.json(
          { error: 'All options must be ranked' },
          { status: 400 }
        )
      }

      // Check for duplicate ranks
      const uniqueRanks = new Set(rankedOptions)
      if (uniqueRanks.size !== rankedOptions.length) {
        return NextResponse.json(
          { error: 'Each option must have a unique rank' },
          { status: 400 }
        )
      }

      // Validate rank values
      const validRanks = pollOptions.map((_, index) => index + 1)
      for (const rank of rankedOptions) {
        if (!validRanks.includes(rank)) {
          return NextResponse.json(
            { error: 'Invalid rank values' },
            { status: 400 }
          )
        }
      }
    }

    // Insert the vote
    const voteData = {
      poll_id: pollId,
      user_id: user.id,
      voting_method: votingMethod || poll.voting_method,
      choice: votingMethod === 'ranked' ? rankings : body.choice,
      voted_at: new Date().toISOString(),
      token: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      merkle_leaf: null, // TODO: Implement merkle tree for privacy
      merkle_proof: null
    }

    const { data: vote, error: insertError } = await supabase
      .from('po_votes')
      .insert([voteData])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting vote:', insertError)
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      )
    }

    // Update poll statistics
    const { error: updateError } = await supabase
      .from('po_polls')
      .update({
        total_votes: (poll.total_votes || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('poll_id', pollId)

    if (updateError) {
      console.error('Error updating poll stats:', updateError)
      // Don't fail the vote if stats update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Vote recorded successfully',
      vote: {
        id: vote.id,
        poll_id: vote.poll_id,
        voting_method: vote.voting_method,
        voted_at: vote.voted_at
      }
    })

  } catch (error: any) {
    console.error('Error in vote endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to create Supabase client' },
        { status: 500 }
      )
    }

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has already voted
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('po_votes')
      .select('*')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .single()

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to check existing vote' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasVoted: !!existingVote,
      userVote: existingVote ? existingVote.choice : null
    })

  } catch (error: any) {
    console.error('Error in vote check endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
