import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { withAuth } from '@/lib/core/auth/middleware';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const voteSchema = z.object({
  pollId: z.string().uuid(),
  optionId: z.string().uuid(),
});

async function handlePost(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 });
    }

    const body = await request.json();
    const validatedData = voteSchema.parse(body);

    const { data: { user }, error: authError } = await (await supabase).auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if poll exists and is active
    const { data: poll, error: pollError } = await (await supabase)
      .from('polls')
      .select('id, created_by, voting_method, privacy_level, end_time, options, total_votes, participation')
      .eq('id', validatedData.pollId)
      .single();

    if (pollError || !poll) {
      logger.error('Poll not found or error fetching poll', pollError as Error);
      return NextResponse.json({ error: 'Poll not found or inactive' }, { status: 404 });
    }

    // Check if voting is allowed (e.g., poll not ended)
    if (poll.end_time && new Date(poll.end_time) < new Date()) {
      return NextResponse.json({ error: 'Voting for this poll has ended' }, { status: 403 });
    }

    // Check if option is valid for this poll and get choice index
    const options = poll.options as any[]; // Assuming options is a JSON array
    const optionIndex = options.findIndex(option => option.id === validatedData.optionId);
    if (optionIndex === -1) {
      return NextResponse.json({ error: 'Invalid option for this poll' }, { status: 400 });
    }

    // Record the vote using existing schema fields (avoid JSONB for performance)
    const { error: voteError } = await (await supabase)
      .from('votes')
      .insert({
        poll_id: validatedData.pollId,
        user_id: user.id,
        choice: optionIndex, // Use existing choice field with correct index
        voting_method: poll.voting_method || 'single_choice',
        // Use proper columns instead of JSONB for better performance
        is_active: true,
        is_verified: false,
        time_spent_seconds: 0, // Could be calculated from client
        page_views: 1,
        // Store only essential option reference in vote_data JSONB
        vote_data: {
          option_id: validatedData.optionId
        }
      });

    if (voteError) {
      logger.error('Error recording vote:', voteError as Error);
      return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
    }

    // Update poll total_votes and participation using existing fields
    const { error: updatePollError } = await (await supabase)
      .from('polls')
      .update({
        total_votes: (poll.total_votes || 0) + 1, // Use existing total_votes field
        participation: (poll.participation || 0) + 1 // Use existing participation field
      })
      .eq('id', validatedData.pollId);

    if (updatePollError) {
      logger.warn('Failed to update poll vote count:', { updatePollError });
    }

    return NextResponse.json({ message: 'Vote recorded successfully' }, { status: 200 });

  } catch (error) {
    logger.error('Error in POST /api/vote:', error as Error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = handlePost;
