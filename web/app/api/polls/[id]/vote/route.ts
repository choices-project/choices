import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// POST /api/polls/[id]/vote - Submit a vote (authenticated users only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const pollId = params.id;

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to vote' },
        { status: 401 }
      );
    }

    // Verify user is active
    const { data: userProfile } = await supabase
      .from('ia_users')
      .select('is_active')
      .eq('stable_id', user.id)
      .single();

    if (!userProfile || !userProfile.is_active) {
      return NextResponse.json(
        { error: 'Active account required to vote' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { choice } = body;

    // Validate choice
    if (!choice || typeof choice !== 'number' || choice < 1) {
      return NextResponse.json(
        { error: 'Valid choice is required' },
        { status: 400 }
      );
    }

    // Verify poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('po_polls')
      .select('poll_id, title, options, status')
      .eq('poll_id', pollId)
      .eq('status', 'active')
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found or not active' },
        { status: 404 }
      );
    }

    // Validate choice is within poll options
    if (choice > poll.options.length) {
      return NextResponse.json(
        { error: 'Invalid choice - option does not exist' },
        { status: 400 }
      );
    }

    // Check if user has already voted (using secure function)
    const { data: existingVote } = await supabase
      .from('po_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this poll' },
        { status: 409 }
      );
    }

    // Create vote token for privacy
    const voteToken = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert vote (individual vote data is protected by RLS)
    const { data: vote, error: voteError } = await supabase
      .from('po_votes')
      .insert({
        poll_id: pollId,
        user_id: user.id,
        token: voteToken,
        choice: choice,
        voted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (voteError) {
      console.error('Error creating vote:', voteError);
      return NextResponse.json(
        { error: 'Failed to submit vote' },
        { status: 500 }
      );
    }

    // Update poll vote count (using secure function)
    const { error: updateError } = await supabase
      .rpc('update_poll_vote_count', { poll_id_param: pollId });

    if (updateError) {
      console.error('Error updating poll vote count:', updateError);
      // Vote was still recorded, just couldn't update count
    }

    // Return success response (no individual vote data)
    return NextResponse.json({
      success: true,
      message: 'Vote submitted successfully',
      poll_id: pollId,
      // Do NOT return individual vote data for privacy
      vote_confirmed: true
    });

  } catch (error) {
    console.error('Error in vote API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/polls/[id]/vote - Check if user has voted (returns boolean only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const pollId = params.id;

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { has_voted: false },
        { status: 200 }
      );
    }

    // Check if user has voted (returns boolean only, no vote data)
    const { data: existingVote } = await supabase
      .from('po_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      has_voted: !!existingVote,
      // Do NOT return any vote details for privacy
    });

  } catch (error) {
    console.error('Error checking vote status:', error);
    return NextResponse.json(
      { has_voted: false },
      { status: 200 }
    );
  }
}
