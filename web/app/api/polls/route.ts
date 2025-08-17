import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getMockPollsResponse } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // If Supabase client is not available, return mock data
    if (!supabase) {
      console.log('Supabase client not available, using mock data');
      return NextResponse.json(getMockPollsResponse());
    }
    
    try {
      const { data, error } = await supabase
        .from('po_polls')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase data to match expected format
      const polls = data?.map(poll => ({
        id: poll.poll_id,
        question: poll.title,
        options: poll.options || [],
        totalVotes: poll.total_votes || 0,
        results: {}, // Will be calculated from votes
        expiresAt: poll.end_time,
        category: 'Community', // Default category
        isActive: poll.status === 'active',
        description: poll.description,
        createdBy: 'Community'
      })) || [];

      return NextResponse.json({ polls });
    } catch (error) {
      console.error('Supabase error:', error);
      // Fallback to mock data
      return NextResponse.json(getMockPollsResponse());
    }
  } catch (error) {
    console.error('Error in polls API:', error);
    // Always return mock data as final fallback
    return NextResponse.json(getMockPollsResponse());
  }
}
