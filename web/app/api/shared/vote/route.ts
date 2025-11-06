import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { poll_id, option_id, voter_session } = await request.json();
    
    if (!poll_id || !option_id || !voter_session) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if poll exists and is shareable
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, is_public, is_shareable')
      .eq('id', poll_id)
      .eq('is_public', true)
      .eq('is_shareable', true)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found or not shareable' }, 
        { status: 404 }
      );
    }

    // Check if option exists for this poll
    const { data: option, error: optionError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('id', option_id)
      .eq('poll_id', poll_id)
      .single();

    if (optionError || !option) {
      return NextResponse.json(
        { error: 'Invalid option for this poll' }, 
        { status: 400 }
      );
    }

    // Check for duplicate vote from same session
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', poll_id)
      .eq('voter_session', voter_session)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this poll' }, 
        { status: 409 }
      );
    }

    // Create anonymous vote (equal weight)
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id,
        option_id,
        voter_session,
        trust_tier: 0, // Anonymous
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (voteError) {
      logger.error('Vote creation error', { error: voteError });
      return NextResponse.json(
        { error: 'Failed to record vote' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vote_id: vote.id,
      message: 'Vote recorded successfully'
    });

  } catch (error) {
    logger.error('Anonymous voting error', { error });
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
