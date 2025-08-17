import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { AutomatedPollsService } from '@/lib/automated-polls';

export const dynamic = 'force-dynamic';

// GET /api/admin/trending-topics
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const { data: userProfile } = await supabase
      .from('ia_users')
      .select('verification_tier')
      .eq('stable_id', user.id)
      .single();

    if (!userProfile || !['T2', 'T3'].includes(userProfile.verification_tier)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const service = new AutomatedPollsService();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const sourceType = searchParams.get('sourceType');

    // Get trending topics
    let topics = await service.getTrendingTopics(limit);

    // Apply filters
    if (status) {
      topics = topics.filter(topic => topic.processingStatus === status);
    }

    if (category) {
      topics = topics.filter(topic => topic.category.includes(category));
    }

    if (sourceType) {
      topics = topics.filter(topic => topic.sourceType === sourceType);
    }

    return NextResponse.json({
      success: true,
      topics,
      count: topics.length,
      filters: {
        status,
        category,
        sourceType,
        limit
      }
    });

  } catch (error) {
    console.error('Error in trending topics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/trending-topics
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const { data: userProfile } = await supabase
      .from('ia_users')
      .select('verification_tier')
      .eq('stable_id', user.id)
      .single();

    if (!userProfile || !['T2', 'T3'].includes(userProfile.verification_tier)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      sourceUrl,
      sourceName,
      sourceType,
      category,
      trendingScore,
      velocity,
      momentum,
      sentimentScore,
      entities,
      metadata
    } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Topic title is required' },
        { status: 400 }
      );
    }

    if (!sourceName?.trim()) {
      return NextResponse.json(
        { error: 'Source name is required' },
        { status: 400 }
      );
    }

    if (!sourceType || !['news', 'social', 'search', 'academic'].includes(sourceType)) {
      return NextResponse.json(
        { error: 'Valid source type is required' },
        { status: 400 }
      );
    }

    const service = new AutomatedPollsService();

    // Create trending topic
    const topic = await service.createTrendingTopic({
      title: title.trim(),
      description: description?.trim(),
      sourceUrl,
      sourceName: sourceName.trim(),
      sourceType,
      category: category || [],
      trendingScore: trendingScore || 0,
      velocity: velocity || 0,
      momentum: momentum || 0,
      sentimentScore: sentimentScore || 0,
      entities: entities || [],
      metadata: metadata || {},
      processingStatus: 'pending',
      analysisData: {}
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Failed to create trending topic' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Trending topic created successfully',
      topic
    });

  } catch (error) {
    console.error('Error creating trending topic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/trending-topics/refresh
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const { data: userProfile } = await supabase
      .from('ia_users')
      .select('verification_tier')
      .eq('stable_id', user.id)
      .single();

    if (!userProfile || !['T2', 'T3'].includes(userProfile.verification_tier)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'refresh') {
      // TODO: Implement data source refresh logic
      // This would trigger the automated data ingestion process
      
      return NextResponse.json({
        success: true,
        message: 'Data source refresh initiated',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error refreshing trending topics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

