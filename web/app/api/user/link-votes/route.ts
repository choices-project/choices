import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';

/**
 * CHOICES PLATFORM - LINK ANONYMOUS VOTES TO USER
 * 
 * Repository: https://github.com/choices-project/choices
 * Live Site: https://choices-platform.vercel.app
 * License: MIT
 * 
 * This endpoint links anonymous votes to a user account when they sign up
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { user_id, voter_session } = body;

    if (!user_id || !voter_session) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id and voter_session' 
      }, { status: 400 });
    }

    // Call the database function
    const { data: linkedCount, error } = await supabase.rpc('link_anonymous_votes_to_user', {
      p_user_id: user_id,
      p_voter_session: voter_session
    });

    if (error) {
      logger.error('Link votes error', { error, userId: user_id });
      return NextResponse.json({ 
        error: 'Failed to link anonymous votes',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      linked_votes_count: linkedCount,
      user_id: user_id,
      voter_session: voter_session,
      platform: 'choices',
      repository: 'https://github.com/choices-project/choices',
      live_site: 'https://choices-platform.vercel.app',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Link votes API error', { error });
    return NextResponse.json({ 
      error: 'Internal server error',
      platform: 'choices',
      repository: 'https://github.com/choices-project/choices'
    }, { status: 500 });
  }
}
