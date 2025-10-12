/**
 * Poll Post-Close API Route
 * 
 * Handles enabling/disabling post-close voting for a poll.
 * Only the poll creator or admin can modify post-close settings.
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { type NextRequest, NextResponse } from 'next/server';

import { AuthenticationError, ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/polls/[id]/post-close - Enable post-close voting
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

    // Check authentication
    // Use Supabase native sessions
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      throw new AuthenticationError('Authentication required to modify post-close settings');
    }
    
    const user = session.user;
    if (!user) {
      throw new AuthenticationError('Authentication required to modify post-close settings');
    }

    // Get poll details
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, title, status, created_by, allow_post_close, baseline_at')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new NotFoundError('Poll not found');
    }

    // Check if user can modify this poll
    if (poll.created_by !== user.id) {
      // Check if user is admin (this would need to be implemented)
      // For now, only poll creator can modify
      throw new ForbiddenError('Only the poll creator can modify post-close settings');
    }

    // Check if poll is closed
    if (poll.status !== 'closed') {
      throw new ValidationError('Post-close voting can only be enabled for closed polls');
    }

    // Check if poll has a baseline
    if (!poll.baseline_at) {
      throw new ValidationError('Poll must have a baseline before enabling post-close voting');
    }

    // Enable post-close voting
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('polls')
      .update({
        allow_post_close: true,
        updated_at: now
      })
      .eq('id', pollId);

    if (updateError) {
      devLog('Error enabling post-close voting:', updateError);
      throw new Error('Failed to enable post-close voting');
    }

    // Log the post-close enablement
    devLog('Post-close voting enabled', {
      pollId,
      title: poll.title,
      enabledBy: user.id,
      baselineAt: poll.baseline_at
    });

    return NextResponse.json({
      success: true,
      message: 'Post-close voting enabled successfully',
      poll: {
        id: pollId,
        allowPostClose: true,
        baselineAt: poll.baseline_at
      }
    });

  } catch (error) {
    devLog('Error in post-close enable API:', error);
    
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

// DELETE /api/polls/[id]/post-close - Disable post-close voting
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

    // Check authentication
    // Use Supabase native sessions
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      throw new AuthenticationError('Authentication required to modify post-close settings');
    }
    
    const user = session.user;
    if (!user) {
      throw new AuthenticationError('Authentication required to modify post-close settings');
    }

    // Get poll details
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, title, status, created_by, allow_post_close')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new NotFoundError('Poll not found');
    }

    // Check if user can modify this poll
    if (poll.created_by !== user.id) {
      // Check if user is admin (this would need to be implemented)
      // For now, only poll creator can modify
      throw new ForbiddenError('Only the poll creator can modify post-close settings');
    }

    // Check if post-close voting is enabled
    if (!poll.allow_post_close) {
      throw new ValidationError('Post-close voting is not enabled for this poll');
    }

    // Disable post-close voting
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('polls')
      .update({
        allow_post_close: false,
        updated_at: now
      })
      .eq('id', pollId);

    if (updateError) {
      devLog('Error disabling post-close voting:', updateError);
      throw new Error('Failed to disable post-close voting');
    }

    // Log the post-close disablement
    devLog('Post-close voting disabled', {
      pollId,
      title: poll.title,
      disabledBy: user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Post-close voting disabled successfully',
      poll: {
        id: pollId,
        allowPostClose: false
      }
    });

  } catch (error) {
    devLog('Error in post-close disable API:', error);
    
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
