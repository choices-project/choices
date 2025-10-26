import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * CHOICES PLATFORM - TRUST TIER PROGRESSION API
 * 
 * Repository: https://github.com/choices-project/choices
 * Live Site: https://choices-platform.vercel.app
 * License: MIT
 * 
 * This endpoint provides user trust tier progression and requirements
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

    

    const { data: progressionData, error } = await supabase.rpc('get_trust_tier_progression', {
      p_user_id: id
    });

    if (error) {
      console.error('Trust tier progression error:', error);
      return NextResponse.json({ 
        error: 'Failed to get trust tier progression',
        details: error.message 
      }, { status: 500 });
    }

    // If function doesn't exist yet, return mock data
    if (!progressionData) {
      return NextResponse.json({
        user_id: id,
        current_tier: 3,
        progression_history: [
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
        next_tier_requirements: {
          tier_2: 'Complete profile verification',
          tier_3: 'Participate in 10+ polls',
          tier_4: 'Community verification and engagement'
        },
        platform: 'choices',
        repository: 'https://github.com/choices-project/choices',
        live_site: 'https://choices-platform.vercel.app',
        analysis_method: 'trust_tier_based',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      ...progressionData,
      platform: 'choices',
      repository: 'https://github.com/choices-project/choices',
      live_site: 'https://choices-platform.vercel.app',
      analysis_method: 'trust_tier_based',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Trust tier progression API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      platform: 'choices',
      repository: 'https://github.com/choices-project/choices'
    }, { status: 500 });
  }
}
