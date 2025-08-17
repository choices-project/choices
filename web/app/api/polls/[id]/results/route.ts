import { NextRequest, NextResponse } from 'next/server';
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

    // Use secure function to get poll results (aggregated only)
    const { data: pollResults, error } = await supabase
      .rpc('get_poll_results', { poll_id_param: pollId });

    if (error) {
      console.error('Error fetching poll results:', error);
      return NextResponse.json(
        { error: 'Failed to fetch poll results' },
        { status: 500 }
      );
    }

    if (!pollResults || pollResults.length === 0) {
      return NextResponse.json(
        { error: 'Poll not found or not active' },
        { status: 404 }
      );
    }

    const result = pollResults[0]; // Should only be one result

    // Additional security: ensure no sensitive data is returned
    const sanitizedResults = {
      poll_id: result.poll_id,
      title: result.title,
      total_votes: result.total_votes,
      participation_rate: result.participation_rate,
      aggregated_results: result.aggregated_results,
      // Only include safe, public fields
      status: 'active',
      message: 'Aggregated results only - no individual vote data'
    };

    return NextResponse.json({
      success: true,
      results: sanitizedResults
    });

  } catch (error) {
    console.error('Error in poll results API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
