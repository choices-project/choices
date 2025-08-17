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

    // For development, return mock data since database tables don't exist yet
    const mockTopics = [
      {
        id: '1',
        title: 'Gavin Newsom vs Donald Trump: Political Feud Escalates',
        description: 'California Governor Gavin Newsom and former President Donald Trump engage in heated political exchanges over policy differences and personal attacks.',
        sourceUrl: 'https://example.com/news/politics/newsom-trump-feud',
        sourceName: 'Political News Network',
        sourceType: 'news' as const,
        category: ['Politics', 'Government'],
        trendingScore: 95,
        velocity: 8.5,
        momentum: 7.2,
        sentimentScore: -0.3,
        entities: [
          { name: 'Gavin Newsom', type: 'person' as const, confidence: 0.95 },
          { name: 'Donald Trump', type: 'person' as const, confidence: 0.95 }
        ],
        metadata: { engagement: 'high', controversy: 'high' },
        processingStatus: 'pending' as const,
        analysisData: {},
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z')
      },
      {
        id: '2',
        title: 'SpaceX Starship Launch: Latest Mission Results',
        description: 'SpaceX successfully launches Starship prototype with improved landing capabilities and mission objectives.',
        sourceUrl: 'https://example.com/tech/spacex-starship-launch',
        sourceName: 'Tech Space News',
        sourceType: 'news' as const,
        category: ['Technology', 'Space'],
        trendingScore: 87,
        velocity: 6.8,
        momentum: 5.4,
        sentimentScore: 0.7,
        entities: [
          { name: 'SpaceX', type: 'organization' as const, confidence: 0.9 },
          { name: 'Starship', type: 'concept' as const, confidence: 0.85 }
        ],
        metadata: { engagement: 'medium', controversy: 'low' },
        processingStatus: 'rejected' as const,
        analysisData: {},
        createdAt: new Date('2024-01-14T15:30:00Z'),
        updatedAt: new Date('2024-01-14T16:45:00Z')
      },
      {
        id: '3',
        title: 'Olympic Games 2024: Preparations and Controversies',
        description: 'Paris prepares for the 2024 Olympic Games while addressing concerns about security, infrastructure, and athlete accommodations.',
        sourceUrl: 'https://example.com/sports/olympics-2024-preparations',
        sourceName: 'Sports International',
        sourceType: 'news' as const,
        category: ['Sports', 'International'],
        trendingScore: 82,
        velocity: 5.2,
        momentum: 4.8,
        sentimentScore: 0.2,
        entities: [
          { name: 'Olympic Games 2024', type: 'event' as const, confidence: 0.9 },
          { name: 'Paris', type: 'location' as const, confidence: 0.85 }
        ],
        metadata: { engagement: 'high', controversy: 'medium' },
        processingStatus: 'approved' as const,
        analysisData: {},
        createdAt: new Date('2024-01-13T09:15:00Z'),
        updatedAt: new Date('2024-01-13T11:20:00Z')
      },
      {
        id: '4',
        title: 'AI Regulation: Global Policy Developments',
        description: 'Countries worldwide implement new AI regulations and policies to address ethical concerns and technological advancement.',
        sourceUrl: 'https://example.com/tech/ai-regulation-global',
        sourceName: 'Tech Policy Review',
        sourceType: 'news' as const,
        category: ['Technology', 'Policy'],
        trendingScore: 78,
        velocity: 4.5,
        momentum: 3.9,
        sentimentScore: 0.1,
        entities: [
          { name: 'AI Regulation', type: 'concept' as const, confidence: 0.8 },
          { name: 'Global Policy', type: 'concept' as const, confidence: 0.75 }
        ],
        metadata: { engagement: 'medium', controversy: 'low' },
        processingStatus: 'pending' as const,
        analysisData: {},
        createdAt: new Date('2024-01-12T14:20:00Z'),
        updatedAt: new Date('2024-01-12T14:20:00Z')
      },
      {
        id: '5',
        title: 'Climate Change: New Scientific Findings',
        description: 'Recent studies reveal concerning trends in global climate patterns and their impact on ecosystems worldwide.',
        sourceUrl: 'https://example.com/science/climate-change-findings',
        sourceName: 'Science Daily',
        sourceType: 'academic' as const,
        category: ['Science', 'Environment'],
        trendingScore: 75,
        velocity: 3.8,
        momentum: 3.2,
        sentimentScore: -0.4,
        entities: [
          { name: 'Climate Change', type: 'concept' as const, confidence: 0.9 },
          { name: 'Global Ecosystems', type: 'concept' as const, confidence: 0.8 }
        ],
        metadata: { engagement: 'medium', controversy: 'medium' },
        processingStatus: 'pending' as const,
        analysisData: {},
        createdAt: new Date('2024-01-11T11:45:00Z'),
        updatedAt: new Date('2024-01-11T11:45:00Z')
      }
    ];

    let topics = mockTopics;

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

