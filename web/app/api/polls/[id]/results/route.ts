import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/polls/[id]/results - Get aggregated poll results only
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const pollId = params.id;
    const supabaseClient = await supabase;

    // Fetch poll data and calculate aggregated results
    const { data: poll, error: pollError } = await supabaseClient
      .from('po_polls')
      .select('poll_id, title, options, total_votes, participation_rate, status')
      .eq('poll_id', pollId as any)
      .eq('status', 'active' as any)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found or not active' },
        { status: 404 }
      );
    }

    // Calculate aggregated results (all zeros for now since no votes exist)
    const aggregatedResults = poll && !('error' in poll) && poll.options ? 
      poll.options.reduce((acc: any, _option: any, index: any) => {
        acc[`option_${index + 1}`] = 0; // Default to 0 until we can count votes
        return acc;
      }, {} as Record<string, number>) : {};

    // Additional security: ensure no sensitive data is returned
    const sanitizedResults = poll && !('error' in poll) ? {
      poll_id: poll.poll_id,
      title: poll.title,
      total_votes: poll.total_votes || 0,
      participation_rate: poll.participation_rate || 0,
      aggregated_results: aggregatedResults,
      // Only include safe, public fields
      status: 'active',
      message: 'Aggregated results only - no individual vote data'
    } : {
      poll_id: pollId,
      title: 'Unknown',
      total_votes: 0,
      participation_rate: 0,
      aggregated_results: {},
      status: 'error',
      message: 'Poll data not available'
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
