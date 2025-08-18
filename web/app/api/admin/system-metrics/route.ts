import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Fetch real metrics from database
    const [topicsResult, pollsResult] = await Promise.all([
      supabase.from('trending_topics').select('id, processing_status'),
      supabase.from('generated_polls').select('id, status')
    ]);

    const totalTopics = topicsResult.data?.length || 0;
    const totalPolls = pollsResult.data?.length || 0;
    const activePolls = pollsResult.data?.filter(poll => poll.status === 'active').length || 0;

    const metrics = {
      total_topics: totalTopics,
      total_polls: totalPolls,
      active_polls: activePolls,
      system_health: 'healthy',
      last_updated: new Date().toISOString()
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system metrics' },
      { status: 500 }
    );
  }
}
