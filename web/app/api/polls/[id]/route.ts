import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id;
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const supabaseClient = await supabase;
    
    // Fetch poll data from po_polls table
    const { data: poll, error } = await supabaseClient
      .from('po_polls')
      .select('poll_id, title, description, options, total_votes, participation_rate, status, privacy_level, category, tags')
      .eq('poll_id', pollId as any)
      .eq('status', 'active' as any)
      .single();

    if (error || !poll || !('poll_id' in poll)) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Return sanitized poll data with privacy info
    const sanitizedPoll = {
      poll_id: poll.poll_id,
      title: poll.title,
      description: poll.description,
      options: poll.options,
      total_votes: poll.total_votes || 0,
      participation_rate: poll.participation_rate || 0,
      privacy_level: poll.privacy_level || 'public',
      category: poll.category,
      tags: poll.tags || [],
      status: 'active', // Always show as active for public view
      created_at: new Date().toISOString(), // Generic timestamp
    };

    return NextResponse.json(sanitizedPoll);
  } catch (error) {
    devLog('Error fetching poll:', error);
    return NextResponse.json(
      { error: 'Failed to fetch poll data' },
      { status: 500 }
    );
  }
}
