import { NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    // Fetch poll data from po_polls table
    const { data: poll, error } = await supabase
      .from('po_polls')
      .select('poll_id, title, description, options, total_votes, participation_rate, status, privacy_level, category, tags')
      .eq('poll_id', pollId)
      .eq('status', 'active')
      .single();

    if (error || !poll) {
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
