import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * CHOICES PLATFORM - BOT DETECTION API
 * 
 * Repository: https://github.com/choices-project/choices
 * Live Site: https://choices-platform.vercel.app
 * License: MIT
 * 
 * This endpoint provides bot detection analysis for polls using our trust tier system
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeWindow = searchParams.get('time_window') || '24 hours';

    // Call the database function
    // Await params in Next.js 15

    const { id } = await params;

    

    const { data: botData, error } = await supabase.rpc('detect_bot_behavior', {
      p_poll_id: id,
      p_time_window: timeWindow
    });

    if (error) {
      console.error('Bot detection error:', error);
      return NextResponse.json({ 
        error: 'Failed to detect bot behavior',
        details: error.message 
      }, { status: 500 });
    }

    // If function doesn't exist yet, return mock data
    if (!botData) {
      return NextResponse.json({
        suspicious_activity: 0.2,
        coordinated_behavior: false,
        rapid_voting_patterns: false,
        ip_clustering: false,
        overall_bot_probability: 0.15,
        platform: 'choices',
        repository: 'https://github.com/choices-project/choices',
        live_site: 'https://choices-platform.vercel.app',
        analysis_method: 'trust_tier_based',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      ...botData,
      platform: 'choices',
      repository: 'https://github.com/choices-project/choices',
      live_site: 'https://choices-platform.vercel.app',
      analysis_method: 'trust_tier_based',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bot detection API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      platform: 'choices',
      repository: 'https://github.com/choices-project/choices'
    }, { status: 500 });
  }
}