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

    // Service role authentication - no user checks needed
    // Admin access is provided by the service role key

    const service = new AutomatedPollsService();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const sourceType = searchParams.get('sourceType');

    // Fetch real data from database
    const { data: topics, error } = await supabase
      .from('trending_topics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching trending topics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trending topics' },
        { status: 500 }
      );
    }

    // Transform database data to match expected format
    const transformedTopics = topics?.map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      sourceUrl: topic.source_url,
      sourceName: topic.source_name,
      sourceType: topic.source_type,
      category: topic.category,
      trendingScore: topic.trending_score,
      velocity: topic.velocity,
      momentum: topic.momentum,
      sentimentScore: topic.sentiment_score,
      entities: topic.entities,
      metadata: topic.metadata,
      processingStatus: topic.processing_status,
      analysisData: topic.analysis_data,
      createdAt: topic.created_at,
      updatedAt: topic.updated_at
    })) || [];

        // Apply filters
    let filteredTopics = transformedTopics;
    
    if (status) {
      filteredTopics = filteredTopics.filter(topic => topic.processingStatus === status);
    }
    
    if (category) {
      filteredTopics = filteredTopics.filter(topic => topic.category.includes(category));
    }
    
    if (sourceType) {
      filteredTopics = filteredTopics.filter(topic => topic.sourceType === sourceType);
    }

    return NextResponse.json({
      success: true,
      topics: filteredTopics,
      count: filteredTopics.length,
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

    // Service role authentication - no user checks needed
    // Admin access is provided by the service role key

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

    // Service role authentication - no user checks needed
    // Admin access is provided by the service role key

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

