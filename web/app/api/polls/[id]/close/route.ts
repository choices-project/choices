/**
 * Poll Close API Route
 * 
 * Handles closing a poll and setting the baseline for results.
 * Only the poll creator or admin can close a poll.
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';
import { AuthenticationError, ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// POST /api/polls/[id]/close - Close a poll and set baseline
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id;

    if (!pollId) {
      throw new ValidationError('Poll ID is required');
    }

    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Check authentication using Supabase native sessions
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      throw new AuthenticationError('Authentication required to close polls');
    }
    
    const user = session.user;

    // Get poll details
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, title, status, created_by, end_time, baseline_at, allow_post_close')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new NotFoundError('Poll not found');
    }

    // Check if user can close this poll
    if (poll.created_by !== user.id) {
      // Check if user is admin (this would need to be implemented)
      // For now, only poll creator can close
      throw new ForbiddenError('Only the poll creator can close this poll');
    }

    // Check if poll is already closed
    if (poll.status === 'closed') {
      throw new ValidationError('Poll is already closed');
    }

    // Check if poll is active
    if (poll.status !== 'active') {
      throw new ValidationError('Only active polls can be closed');
    }

    // Set baseline timestamp (current time)
    const baselineAt = new Date().toISOString();
    const now = new Date().toISOString();

    // Close the poll
    const { error: updateError } = await supabase
      .from('polls')
      .update({
        status: 'closed',
        baseline_at: baselineAt,
        updated_at: now
      })
      .eq('id', pollId);

    if (updateError) {
      devLog('Error closing poll:', updateError);
      throw new Error('Failed to close poll');
    }

    // Log the poll closure
    devLog('Poll closed successfully', {
      pollId,
      title: poll.title,
      closedBy: user.id,
      baselineAt
    });

    return NextResponse.json({
      success: true,
      message: 'Poll closed successfully',
      poll: {
        id: pollId,
        status: 'closed',
        baselineAt,
        allowPostClose: poll.allow_post_close
      }
    });

  } catch (error) {
    devLog('Error in poll close API:', error);
    
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
