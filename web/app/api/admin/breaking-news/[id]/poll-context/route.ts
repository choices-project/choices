import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { RealTimeNewsService } from '@/lib/real-time-news-service';

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
      .from('ia_users')
      .select('verification_tier')
      .eq('stable_id', String(user.id) as any)
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

    // Store the poll context in the database
    const { data: contextData, error: contextError } = await supabaseClient
      .from('poll_contexts')
      .insert([{
        story_id: storyId,
        question: pollContext.question,
        context: pollContext.context,
        why_important: pollContext.whyImportant,
        stakeholders: pollContext.stakeholders,
        options: pollContext.options,
        voting_method: pollContext.votingMethod,
        estimated_controversy: pollContext.estimatedControversy,
        time_to_live: pollContext.timeToLive,
        status: 'draft'
      }] as any)
      .select()
      .single();

    if (contextError) {
      devLog('Error storing poll context:', contextError);
      return NextResponse.json(
        { error: 'Failed to store poll context' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pollContext: {
        ...pollContext,
        id: contextData && 'id' in contextData ? contextData.id : undefined,
        status: contextData && 'status' in contextData ? contextData.status : undefined,
        createdAt: contextData && 'created_at' in contextData ? contextData.created_at : undefined
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
    devLog('Error generating poll context:', error);
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
      .from('ia_users')
      .select('verification_tier')
      .eq('stable_id', String(user.id) as any)
      .single();

    if (profileError) {
      devLog('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      );
    }

    if (!userProfile || !userProfile || !('verification_tier' in userProfile) || !['T2', 'T3'].includes(userProfile.verification_tier)) {
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

    // Get existing poll context
    const { data: contextData, error: contextError } = await supabaseClient
      .from('poll_contexts')
      .select('id, email, verification_tier, created_at, updated_at, display_name, avatar_url, bio, stable_id, is_active')
      .eq('story_id', storyId as any)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (contextError && contextError.code !== 'PGRST116') {
      devLog('Error fetching poll context:', contextError);
      return NextResponse.json(
        { error: 'Failed to fetch poll context' },
        { status: 500 }
      );
    }

    // Get the breaking news story
    const service = new RealTimeNewsService();
    const story = await service.getBreakingNewsById(storyId);

    return NextResponse.json({
      success: true,
      pollContext: contextData || null,
      story: story ? {
        id: story.id,
        headline: story.headline,
        summary: story.summary,
        urgency: story.urgency,
        sentiment: story.sentiment
      } : null,
      hasExistingContext: !!contextData
    });

  } catch (error) {
    devLog('Error fetching poll context:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
