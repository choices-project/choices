import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/polls/[id]/results - Get aggregated poll results only
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pollId = id;
    const supabaseClient = await getSupabaseServerClient();

    // Fetch poll data and calculate aggregated results
    const { data: poll, error: pollError } = await supabaseClient
      .from('polls')
      .select('id, title, participation, status')
      .eq('id', pollId)
      .eq('status', 'active')
      .single();

    if (pollError) {
      return NextResponse.json(
        { error: 'Poll not found or not active' },
        { status: 404 }
      );
    }
    
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found or not active' },
        { status: 404 }
      );
    }

    // Get poll options from the poll_options table
    const { data: pollOptions, error: optionsError } = await supabaseClient
      .from('poll_options')
      .select('id, text, vote_count')
      .eq('poll_id', pollId)
      .order('order_index');

    if (optionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch poll options' },
        { status: 500 }
      );
    }

    // Calculate aggregated results
    const aggregatedResults = (pollOptions || []).reduce((acc: Record<string, number>, option: any) => {
      acc[option.id] = option.vote_count || 0;
      return acc;
    }, {});

    const totalVotes = (pollOptions || []).reduce((sum: number, option: any) => sum + (option.vote_count || 0), 0);

    // Additional security: ensure no sensitive data is returned
    const sanitizedResults = {
      id: poll.id,
      title: poll.title,
      total_votes: totalVotes,
      participation: poll.participation ?? 0,
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
    devLog('Error in poll results API:', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
