import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { AutomatedPollsService } from '@/lib/automated-polls';

export const dynamic = 'force-dynamic';

// GET /api/admin/generated-polls
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
    const status = searchParams.get('status') as any;
    const category = searchParams.get('category');
    const votingMethod = searchParams.get('votingMethod');
    const minQualityScore = parseFloat(searchParams.get('minQualityScore') || '0');

    // For development, return mock data since database tables don't exist yet
    const mockPolls = [
      {
        id: '1',
        topicId: '1',
        title: 'Who do you think is winning the political feud between Gavin Newsom and Donald Trump?',
        description: 'Based on recent exchanges and public opinion polls, who appears to be gaining more support?',
        options: [
          { id: '1', text: 'Gavin Newsom is winning', description: 'Newsom has stronger arguments and public support' },
          { id: '2', text: 'Donald Trump is winning', description: 'Trump has more vocal supporters and media attention' },
          { id: '3', text: 'It\'s too close to call', description: 'Both sides have valid points and strong followings' },
          { id: '4', text: 'Neither is winning', description: 'The feud is damaging to both political parties' }
        ],
        votingMethod: 'single_choice' as const,
        category: 'Politics',
        tags: ['politics', 'newsom', 'trump', 'feud'],
        qualityScore: 8.5,
        status: 'pending' as const,
        topicAnalysis: { sentiment: 'negative', controversy: 'high' },
        qualityMetrics: { bias: 0.2, clarity: 0.9, completeness: 0.8 },
        generationMetadata: { source: 'automated', confidence: 0.85 },
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z')
      },
      {
        id: '2',
        topicId: '3',
        title: 'How confident are you that the 2024 Paris Olympics will be successful?',
        description: 'Considering the preparations, security measures, and infrastructure development, what\'s your confidence level?',
        options: [
          { id: '1', text: 'Very confident', description: 'Paris is well-prepared and will deliver an excellent Olympics' },
          { id: '2', text: 'Somewhat confident', description: 'Most aspects are ready, with minor concerns' },
          { id: '3', text: 'Not very confident', description: 'There are significant concerns about readiness' },
          { id: '4', text: 'Not confident at all', description: 'The Olympics will face major problems' }
        ],
        votingMethod: 'single_choice' as const,
        category: 'Sports',
        tags: ['olympics', 'paris', 'sports', 'international'],
        qualityScore: 7.8,
        status: 'approved' as const,
        approvedBy: 'admin',
        approvedAt: new Date('2024-01-13T12:00:00Z'),
        topicAnalysis: { sentiment: 'neutral', controversy: 'medium' },
        qualityMetrics: { bias: 0.1, clarity: 0.8, completeness: 0.7 },
        generationMetadata: { source: 'automated', confidence: 0.75 },
        createdAt: new Date('2024-01-13T09:30:00Z'),
        updatedAt: new Date('2024-01-13T12:00:00Z')
      },
      {
        id: '3',
        topicId: '4',
        title: 'What approach should governments take to AI regulation?',
        description: 'As AI technology advances rapidly, what regulatory approach do you think is most appropriate?',
        options: [
          { id: '1', text: 'Strict regulation', description: 'Heavy oversight to prevent misuse and ensure safety' },
          { id: '2', text: 'Moderate regulation', description: 'Balanced approach with some oversight but not stifling innovation' },
          { id: '3', text: 'Light regulation', description: 'Minimal oversight to encourage innovation and development' },
          { id: '4', text: 'No regulation', description: 'Let the market and industry self-regulate' }
        ],
        votingMethod: 'single_choice' as const,
        category: 'Technology',
        tags: ['ai', 'regulation', 'technology', 'policy'],
        qualityScore: 8.2,
        status: 'pending' as const,
        topicAnalysis: { sentiment: 'neutral', controversy: 'medium' },
        qualityMetrics: { bias: 0.15, clarity: 0.9, completeness: 0.85 },
        generationMetadata: { source: 'automated', confidence: 0.8 },
        createdAt: new Date('2024-01-12T15:00:00Z'),
        updatedAt: new Date('2024-01-12T15:00:00Z')
      }
    ];

    let polls = mockPolls;

    // Apply additional filters
    if (category) {
      polls = polls.filter(poll => poll.category === category);
    }

    if (votingMethod) {
      polls = polls.filter(poll => poll.votingMethod === votingMethod);
    }

    if (minQualityScore > 0) {
      polls = polls.filter(poll => poll.qualityScore >= minQualityScore);
    }

    // Get quality metrics for each poll
    const pollsWithMetrics = await Promise.all(
      polls.map(async (poll) => {
        const metrics = await service.getQualityMetrics(poll.id);
        return {
          ...poll,
          qualityMetrics: metrics
        };
      })
    );

    return NextResponse.json({
      success: true,
      polls: pollsWithMetrics,
      count: pollsWithMetrics.length,
      filters: {
        status,
        category,
        votingMethod,
        minQualityScore,
        limit
      }
    });

  } catch (error) {
    console.error('Error in generated polls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/generated-polls
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
      topicId,
      title,
      description,
      options,
      votingMethod,
      category,
      tags,
      topicAnalysis,
      generationMetadata
    } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Poll title is required' },
        { status: 400 }
      );
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 options are required' },
        { status: 400 }
      );
    }

    if (!votingMethod || !['single', 'multiple', 'ranked', 'approval', 'range', 'quadratic'].includes(votingMethod)) {
      return NextResponse.json(
        { error: 'Valid voting method is required' },
        { status: 400 }
      );
    }

    // Validate options
    const invalidOptions = options.filter((option: any) => !option.text?.trim());
    if (invalidOptions.length > 0) {
      return NextResponse.json(
        { error: 'All options must have text' },
        { status: 400 }
      );
    }

    const service = new AutomatedPollsService();

    // Create generated poll
    const poll = await service.createGeneratedPoll({
      topicId,
      title: title.trim(),
      description: description?.trim(),
      options: options.map((option: any) => ({
        id: option.id || `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: option.text.trim(),
        description: option.description?.trim(),
        metadata: option.metadata || {}
      })),
      votingMethod,
      category,
      tags: tags || [],
      qualityScore: 0, // Will be calculated
      status: 'draft',
      topicAnalysis: topicAnalysis || {},
      qualityMetrics: {},
      generationMetadata: generationMetadata || {}
    });

    if (!poll) {
      return NextResponse.json(
        { error: 'Failed to create generated poll' },
        { status: 500 }
      );
    }

    // Calculate and store quality metrics
    const { assessPollQuality } = await import('@/lib/automated-polls');
    const qualityMetrics = assessPollQuality(poll);
    await service.createQualityMetrics({
      pollId: poll.id,
      biasScore: qualityMetrics.biasScore,
      clarityScore: qualityMetrics.clarityScore,
      completenessScore: qualityMetrics.completenessScore,
      relevanceScore: qualityMetrics.relevanceScore,
      controversyScore: qualityMetrics.controversyScore,
      overallScore: qualityMetrics.overallScore,
      assessmentMetadata: qualityMetrics.assessmentMetadata
    });

    // Update poll with quality score
    await service.updateGeneratedPoll(poll.id, {
      qualityScore: qualityMetrics.overallScore
    });

    return NextResponse.json({
      success: true,
      message: 'Generated poll created successfully',
      poll: {
        ...poll,
        qualityScore: qualityMetrics.overallScore
      }
    });

  } catch (error) {
    console.error('Error creating generated poll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

