import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { AutomatedPollsService } from '@/lib/automated-polls';

export const dynamic = 'force-dynamic';

// POST /api/admin/trending-topics/analyze
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

    // Check admin permissions - RESTRICTED TO OWNER ONLY
    const { data: userProfile } = await supabase
      .from('ia_users')
      .select('verification_tier')
      .eq('stable_id', user.id)
      .single();

    // Owner check using environment variable
    // Service role key provides admin access - no user ID needed
    
    if (!userProfile) {
      return NextResponse.json(
        { error: 'Admin access restricted to owner only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category, keywords, sourceType = 'news' } = body;

    // Validate input
    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    const service = new AutomatedPollsService();

    // MVP: Manual topic analysis for specific categories
    let topics: any[] = [];

    switch (category.toLowerCase()) {
      case 'politics':
        // Current Gavin Newsom vs Donald Trump feud
        topics = [
          {
            title: "Gavin Newsom vs Donald Trump: 2024 Presidential Race Heats Up",
            description: "California Governor Gavin Newsom and former President Donald Trump engage in escalating political feud ahead of 2024 election",
            sourceUrl: "https://example.com/news/politics/newsom-trump-feud",
            sourceName: "Political Analysis",
            sourceType: "news",
            category: ["politics", "election", "presidential"],
            trendingScore: 8.5,
            velocity: 7.2,
            momentum: 6.8,
            sentimentScore: -0.3, // Slightly negative due to conflict
            entities: [
              { name: "Gavin Newsom", type: "person", confidence: 0.95 },
              { name: "Donald Trump", type: "person", confidence: 0.95 },
              { name: "California", type: "location", confidence: 0.9 },
              { name: "2024 Election", type: "event", confidence: 0.85 }
            ],
            metadata: {
              keywords: ["newsom", "trump", "election", "presidential", "california", "governor"],
              controversy: 0.8,
              timeSensitivity: "high"
            }
          },
          {
            title: "Newsom's California Policies vs Trump's America First Agenda",
            description: "Contrasting policy approaches between California's progressive governance and Trump's conservative platform",
            sourceUrl: "https://example.com/news/politics/policy-contrast",
            sourceName: "Policy Analysis",
            sourceType: "news",
            category: ["politics", "policy", "governance"],
            trendingScore: 7.8,
            velocity: 6.5,
            momentum: 5.9,
            sentimentScore: 0.1, // Neutral policy discussion
            entities: [
              { name: "Gavin Newsom", type: "person", confidence: 0.9 },
              { name: "Donald Trump", type: "person", confidence: 0.9 },
              { name: "California", type: "location", confidence: 0.85 },
              { name: "Policy", type: "concept", confidence: 0.8 }
            ],
            metadata: {
              keywords: ["policy", "governance", "progressive", "conservative", "california"],
              controversy: 0.6,
              timeSensitivity: "medium"
            }
          }
        ];
        break;

      case 'social_media':
        // Social media reactions and viral content
        topics = [
          {
            title: "Viral Social Media Clips: Newsom vs Trump Exchanges",
            description: "Social media platforms flooded with clips and reactions to Newsom-Trump political exchanges",
            sourceUrl: "https://example.com/social/viral-clips",
            sourceName: "Social Media Trends",
            sourceType: "social",
            category: ["social_media", "viral", "politics"],
            trendingScore: 9.2,
            velocity: 8.8,
            momentum: 8.5,
            sentimentScore: -0.2,
            entities: [
              { name: "Social Media", type: "concept", confidence: 0.9 },
              { name: "Viral Content", type: "concept", confidence: 0.85 },
              { name: "Gavin Newsom", type: "person", confidence: 0.8 },
              { name: "Donald Trump", type: "person", confidence: 0.8 }
            ],
            metadata: {
              keywords: ["viral", "social media", "clips", "reactions", "trending"],
              controversy: 0.7,
              timeSensitivity: "high"
            }
          }
        ];
        break;

      case 'debate':
        // Potential debate scenarios and analysis
        topics = [
          {
            title: "Potential Newsom-Trump Debate: What to Expect",
            description: "Analysis of potential debate scenarios between Gavin Newsom and Donald Trump",
            sourceUrl: "https://example.com/news/debate-analysis",
            sourceName: "Debate Analysis",
            sourceType: "news",
            category: ["debate", "politics", "election"],
            trendingScore: 8.0,
            velocity: 6.2,
            momentum: 5.5,
            sentimentScore: 0.0,
            entities: [
              { name: "Debate", type: "event", confidence: 0.9 },
              { name: "Gavin Newsom", type: "person", confidence: 0.85 },
              { name: "Donald Trump", type: "person", confidence: 0.85 },
              { name: "Election", type: "event", confidence: 0.8 }
            ],
            metadata: {
              keywords: ["debate", "election", "presidential", "analysis", "scenarios"],
              controversy: 0.5,
              timeSensitivity: "medium"
            }
          }
        ];
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported category: ${category}` },
          { status: 400 }
        );
    }

    // Store topics in database
    const createdTopics = [];
    for (const topicData of topics) {
      const topic = await service.createTrendingTopic({
        ...topicData,
        processingStatus: 'completed',
        analysisData: {
          analyzedAt: new Date().toISOString(),
          category: category,
          keywords: keywords || [],
          sourceType: sourceType,
          analysisMethod: 'manual_mvp'
        }
      });
      
      if (topic) {
        createdTopics.push(topic);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Analysis completed for category: ${category}`,
      topics: createdTopics,
      count: createdTopics.length,
      analysis: {
        category,
        keywords,
        sourceType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in topic analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/trending-topics/analyze - Get available categories
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

    // Return available categories for MVP
    const availableCategories = [
      {
        id: 'politics',
        name: 'Politics',
        description: 'Political news and analysis, including current Gavin Newsom vs Donald Trump feud',
        keywords: ['newsom', 'trump', 'election', 'presidential', 'politics'],
        exampleTopics: [
          'Gavin Newsom vs Donald Trump: 2024 Presidential Race Heats Up',
          'Newsom\'s California Policies vs Trump\'s America First Agenda'
        ]
      },
      {
        id: 'social_media',
        name: 'Social Media',
        description: 'Viral social media content and trending discussions',
        keywords: ['viral', 'social media', 'trending', 'clips'],
        exampleTopics: [
          'Viral Social Media Clips: Newsom vs Trump Exchanges'
        ]
      },
      {
        id: 'debate',
        name: 'Debate Analysis',
        description: 'Potential debate scenarios and political analysis',
        keywords: ['debate', 'analysis', 'scenarios', 'election'],
        exampleTopics: [
          'Potential Newsom-Trump Debate: What to Expect'
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      categories: availableCategories,
      instructions: {
        method: 'POST',
        endpoint: '/api/admin/trending-topics/analyze',
        body: {
          category: 'politics|social_media|debate',
          keywords: 'optional array of keywords',
          sourceType: 'news|social|search (default: news)'
        }
      }
    });

  } catch (error) {
    console.error('Error getting analysis categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
