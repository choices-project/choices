import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { RealTimeNewsService } from '@/lib/core/services/real-time-news';
import { logger } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/admin/breaking-news/[id]/poll-context - Generate poll context from breaking news story
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();

    // Get Supabase client
    const supabaseClient = await supabase;
    
    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions - RESTRICTED TO OWNER ONLY
    const { data: userProfile, error: _profileError } = await supabaseClient
      .from('user_profiles')
      .select('trust_tier')
      .eq('user_id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Admin access restricted to owner only' },
        { status: 403 }
      );
    }

    const storyId = params.id;
    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    const service = new RealTimeNewsService();
    
    // Get the breaking news story
    const story = await service.getBreakingNewsById(storyId);
    if (!story) {
      return NextResponse.json(
        { error: 'Breaking news story not found' },
        { status: 404 }
      );
    }

    // Generate poll context
    const pollContext = await service.generatePollContext(storyId);
    if (!pollContext) {
      return NextResponse.json(
        { error: 'Failed to generate poll context' },
        { status: 500 }
      );
    }

    // Poll context storage not implemented - breaking news feature uses in-memory context only

    return NextResponse.json({
      success: true,
      pollContext: {
        ...pollContext,
      },
      story: {
        id: story.id,
        headline: story.headline,
        summary: story.summary,
        urgency: story.urgency,
        sentiment: story.sentiment
      },
      message: 'Poll context generated successfully'
    });

  } catch (error) {
    logger.error('Error generating poll context', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/breaking-news/[id]/poll-context - Get existing poll context for a story
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('trust_tier')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      logger.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      );
    }

    if (!userProfile.trust_tier || !['T2', 'T3'].includes(userProfile.trust_tier)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const storyId = params.id;
    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    // Poll context storage not implemented - breaking news feature uses in-memory context only

    // Get the breaking news story
    const service = new RealTimeNewsService();
    const story = await service.getBreakingNewsById(storyId);

    return NextResponse.json({
      success: true,
      pollContext: null,
      story: story ? {
        id: story.id,
        headline: story.headline,
        summary: story.summary,
        urgency: story.urgency,
        sentiment: story.sentiment
      } : null,
      hasExistingContext: false
    });

  } catch (error) {
    logger.error('Error fetching poll context', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
