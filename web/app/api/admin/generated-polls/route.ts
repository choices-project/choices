import { NextRequest, NextResponse } from 'next/server'
import { devLog } from '@/lib/logger';
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

    // Fetch real data from database
    const { data: polls, error } = await supabase
      .from('generated_polls').select('id, title, description, status, created_at, updated_at, topic_id, options, voting_method, category, tags, quality_score, approved_by, approved_at, topic_analysis, quality_metrics, generation_metadata')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      devLog('Error fetching generated polls:', error);
      return NextResponse.json(
        { error: 'Failed to fetch generated polls' },
        { status: 500 }
      );
    }

    // Transform database data to match expected format
    const transformedPolls = polls?.map(poll => ({
      id: poll.id,
      topicId: poll.topic_id,
      title: poll.title,
      description: poll.description,
      options: poll.options,
      votingMethod: poll.voting_method,
      category: poll.category,
      tags: poll.tags,
      qualityScore: poll.quality_score,
      status: poll.status,
      approvedBy: poll.approved_by,
      approvedAt: poll.approved_at,
      topicAnalysis: poll.topic_analysis,
      qualityMetrics: poll.quality_metrics,
      generationMetadata: poll.generation_metadata,
      createdAt: poll.created_at,
      updatedAt: poll.updated_at
    })) || [];

    // Apply additional filters
    let filteredPolls = transformedPolls;
    
    if (category) {
      filteredPolls = filteredPolls.filter(poll => poll.category === category);
    }

    if (votingMethod) {
      filteredPolls = filteredPolls.filter(poll => poll.votingMethod === votingMethod);
    }

    if (minQualityScore > 0) {
      filteredPolls = filteredPolls.filter(poll => poll.qualityScore >= minQualityScore);
    }

    // Get quality metrics for each poll
    const pollsWithMetrics = await Promise.all(
      filteredPolls.map(async (poll) => {
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
    devLog('Error in generated polls API:', error);
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
    devLog('Error creating generated poll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

