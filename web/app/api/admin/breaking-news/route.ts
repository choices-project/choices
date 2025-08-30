import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { RealTimeNewsService } from '@/lib/real-time-news-service';

export const dynamic = 'force-dynamic';

// GET /api/admin/breaking-news - Get breaking news stories
export async function GET(request: NextRequest) {
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

    // Check admin permissions - RESTRICTED TO OWNER ONLY
    const { data: userProfile } = await supabaseClient
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const urgency = searchParams.get('urgency');
    const category = searchParams.get('category');

    const service = new RealTimeNewsService();
    let stories = await service.getBreakingNews(limit);

    // Apply filters
    if (urgency) {
      stories = stories.filter(story => story.urgency === urgency);
    }

    if (category) {
      stories = stories.filter(story => story.category.includes(category));
    }

    return NextResponse.json({
      success: true,
      stories,
      count: stories.length,
      filters: {
        urgency,
        category,
        limit
      }
    });

  } catch (error) {
    devLog('Error fetching breaking news:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/breaking-news - Create new breaking news story
export async function POST(request: NextRequest) {
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

    // Check admin permissions - RESTRICTED TO OWNER ONLY
    const { data: userProfile } = await supabaseClient
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

    const body = await request.json();
    const {
      headline,
      summary,
      fullStory,
      sourceUrl,
      sourceName,
      sourceReliability = 0.9,
      category = [],
      urgency = 'medium',
      sentiment = 'neutral',
      entities = [],
      metadata = {}
    } = body;

    // Validate required fields
    if (!headline || !summary || !sourceName) {
      return NextResponse.json(
        { error: 'Headline, summary, and source name are required' },
        { status: 400 }
      );
    }

    const service = new RealTimeNewsService();
    const story = await service.createBreakingNews({
      headline,
      summary,
      fullStory,
      sourceUrl,
      sourceName,
      sourceReliability,
      category,
      urgency,
      sentiment,
      entities,
      metadata
    });

    if (!story) {
      return NextResponse.json(
        { error: 'Failed to create breaking news story' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      story,
      message: 'Breaking news story created successfully'
    });

  } catch (error) {
    devLog('Error creating breaking news:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
