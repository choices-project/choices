import { NextRequest, NextResponse } from 'next/server'
import { devLog } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET /api/polls/[id]/results - Get aggregated poll results only
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

    // Fetch poll data and calculate aggregated results
    const { data: poll, error: pollError } = await supabase
      .from('po_polls')
      .select('poll_id, title, options, total_votes, participation_rate, status')
      .eq('poll_id', pollId)
      .eq('status', 'active')
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found or not active' },
        { status: 404 }
      );
    }

    // Calculate aggregated results (all zeros for now since no votes exist)
    const aggregatedResults = poll.options ? 
      poll.options.reduce((acc, option, index) => {
        acc[`option_${index + 1}`] = 0; // Default to 0 until we can count votes
        return acc;
      }, {} as Record<string, number>) : {};

    // Additional security: ensure no sensitive data is returned
    const sanitizedResults = {
      poll_id: poll.poll_id,
      title: poll.title,
      total_votes: poll.total_votes || 0,
      participation_rate: poll.participation_rate || 0,
      aggregated_results: aggregatedResults,
      // Only include safe, public fields
      status: 'active',
      message: 'Aggregated results only - no individual vote data'
    };

    return NextResponse.json({
      success: true,
      results: sanitizedResults
    });

  } catch (error) {
    devLog('Error in poll results API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
