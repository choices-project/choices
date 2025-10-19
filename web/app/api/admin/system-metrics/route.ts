import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';
import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export async function GET(_request: NextRequest) {
  // Single admin gate - returns 401 if not admin
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  try {
    const supabase = getSupabaseServerClient();
    
    // Get Supabase client
    const supabaseClient = await supabase;
    
    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }
    
    // Fetch real metrics from database
    const [pollsResult, feedbackResult] = await Promise.all([
      supabaseClient.from('polls').select('id, status'),
      supabaseClient.from('feedback').select('id, status')
    ]);

    const totalPolls = pollsResult.data?.length || 0;
    const activePolls = pollsResult.data?.filter((poll: any) => poll && 'status' in poll && poll.status === 'active').length || 0;
    const totalFeedback = feedbackResult.data?.length || 0;

    const metrics = {
      total_topics: totalFeedback, // Using feedback as topics for now
      total_polls: totalPolls,
      active_polls: activePolls,
      system_health: 'healthy',
      last_updated: new Date().toISOString()
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    devLog('Error fetching system metrics:', { error });
    return NextResponse.json(
      { error: 'Failed to fetch system metrics' },
      { status: 500 }
    );
  }
}
