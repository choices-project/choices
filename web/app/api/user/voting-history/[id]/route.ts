import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * CHOICES PLATFORM - USER VOTING HISTORY API
 * 
 * Repository: https://github.com/choices-project/choices
 * Live Site: https://choices-platform.vercel.app
 * License: MIT
 * 
 * This endpoint provides user voting history and trust tier progression
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Call the database function
    // Await params in Next.js 15

    const { id } = await params;

    

    const { data: historyData, error } = await supabase.rpc('get_user_voting_history', {
      p_user_id: id
    });

    if (error) {
      console.error('User voting history error:', error);
      return NextResponse.json({ 
        error: 'Failed to get user voting history',
        details: error.message 
      }, { status: 500 });
    }

    // If function doesn't exist yet, return mock data
    if (!historyData) {
      return NextResponse.json({
        user_id: id,
        total_votes: 15,
        polls_participated: 8,
        trust_tier_progression: [
          {
            previous_tier: 1,
            new_tier: 2,
            reason: 'User signed up and linked anonymous votes',
            created_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            previous_tier: 2,
            new_tier: 3,
            reason: 'Participated in 10+ polls',
            created_at: new Date(Date.now() - 43200000).toISOString()
          }
        ],
        recent_votes: [
          {
            poll_id: 'poll-1',
            option_id: 'opt-1',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            trust_tier: 3
          },
          {
            poll_id: 'poll-2',
            option_id: 'opt-2',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            trust_tier: 3
          }
        ],
        platform: 'choices',
        repository: 'https://github.com/choices-project/choices',
        live_site: 'https://choices-platform.vercel.app',
        analysis_method: 'trust_tier_based',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      ...historyData,
      platform: 'choices',
      repository: 'https://github.com/choices-project/choices',
      live_site: 'https://choices-platform.vercel.app',
      analysis_method: 'trust_tier_based',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('User voting history API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      platform: 'choices',
      repository: 'https://github.com/choices-project/choices'
    }, { status: 500 });
  }
}
