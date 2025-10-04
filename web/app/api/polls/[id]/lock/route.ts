/**
 * Poll Lock API Route
 * 
 * Handles locking a poll to prevent further changes.
 * Only the poll creator or admin can lock a poll.
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';
import { AuthenticationError, ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// POST /api/polls/[id]/lock - Lock a poll
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
      throw new AuthenticationError('Authentication required to lock polls');
    }
    
    const user = session.user;

    // Get poll details
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, title, status, created_by, locked_at')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new NotFoundError('Poll not found');
    }

    // Check if user can lock this poll
    if (poll.created_by !== user.id) {
      // Check if user is admin (this would need to be implemented)
      // For now, only poll creator can lock
      throw new ForbiddenError('Only the poll creator can lock this poll');
    }

    // Check if poll is already locked
    if (poll.locked_at) {
      throw new ValidationError('Poll is already locked');
    }

    // Check if poll is in a state that can be locked
    if (poll.status === 'draft') {
      throw new ValidationError('Draft polls cannot be locked');
    }

    // Lock the poll
    const lockedAt = new Date().toISOString();
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('polls')
      .update({
        locked_at: lockedAt,
        updated_at: now
      })
      .eq('id', pollId);

    if (updateError) {
      devLog('Error locking poll:', updateError);
      throw new Error('Failed to lock poll');
    }

    // Log the poll lock
    devLog('Poll locked successfully', {
      pollId,
      title: poll.title,
      lockedBy: user.id,
      lockedAt
    });

    return NextResponse.json({
      success: true,
      message: 'Poll locked successfully',
      poll: {
        id: pollId,
        lockedAt,
        status: poll.status
      }
    });

  } catch (error) {
    devLog('Error in poll lock API:', error);
    
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

// DELETE /api/polls/[id]/lock - Unlock a poll
export async function DELETE(
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
      throw new AuthenticationError('Authentication required to unlock polls');
    }
    
    const user = session.user;

    // Get poll details
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, title, status, created_by, locked_at')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new NotFoundError('Poll not found');
    }

    // Check if user can unlock this poll
    if (poll.created_by !== user.id) {
      // Check if user is admin (this would need to be implemented)
      // For now, only poll creator can unlock
      throw new ForbiddenError('Only the poll creator can unlock this poll');
    }

    // Check if poll is locked
    if (!poll.locked_at) {
      throw new ValidationError('Poll is not locked');
    }

    // Unlock the poll
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('polls')
      .update({
        locked_at: null,
        updated_at: now
      })
      .eq('id', pollId);

    if (updateError) {
      devLog('Error unlocking poll:', updateError);
      throw new Error('Failed to unlock poll');
    }

    // Log the poll unlock
    devLog('Poll unlocked successfully', {
      pollId,
      title: poll.title,
      unlockedBy: user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Poll unlocked successfully',
      poll: {
        id: pollId,
        lockedAt: null,
        status: poll.status
      }
    });

  } catch (error) {
    devLog('Error in poll unlock API:', error);
    
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
