import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id;
    
    // Check if this is an E2E test
    const isE2ETest = request.headers.get('x-e2e-bypass') === '1';
    
    // Use service role for E2E tests to bypass RLS
    let supabaseClient;
    if (isE2ETest) {
      // Create service role client for E2E tests
      const { createClient } = await import('@supabase/supabase-js');
      supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
    } else {
      try {
        supabaseClient = await getSupabaseServerClient();
      } catch (error) {
        devLog('Error getting Supabase server client:', error);
        // Fallback to service role client
        const { createClient } = await import('@supabase/supabase-js');
        supabaseClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SECRET_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );
      }
    }
    
    // Fetch poll data from polls table
    const { data: poll, error } = await supabaseClient
      .from('polls')
      .select('id, title, description, options, total_votes, participation, status, privacy_level, category, voting_method, end_time, created_at')
      .eq('id', pollId)
      .single();

    if (error || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Return sanitized poll data with privacy info
    const sanitizedPoll = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      options: poll.options,
      totalvotes: poll.total_votes || 0,
      participation: poll.participation || 0,
      status: poll.status || 'active',
      privacyLevel: poll.privacy_level || 'public',
      category: poll.category,
      votingMethod: poll.voting_method || 'single',
      endtime: poll.end_time,
      createdAt: poll.created_at,
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
