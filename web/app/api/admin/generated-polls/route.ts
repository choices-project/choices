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

    // HARDCODED OWNER CHECK - Replace 'your-user-id-here' with your actual user ID
    const OWNER_USER_ID = 'your-user-id-here'; // TODO: Replace with your actual user ID
    
    if (!userProfile || user.id !== OWNER_USER_ID) {
      return NextResponse.json(
        { error: 'Admin access restricted to owner only' },
        { status: 403 }
      );
    }

    const service = new AutomatedPollsService();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as any;
    const category = searchParams.get('category');
    const votingMethod = searchParams.get('votingMethod');
    const minQualityScore = parseFloat(searchParams.get('minQualityScore') || '0');

    // Get generated polls
    let polls = await service.getGeneratedPolls(status, limit);

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

    // HARDCODED OWNER CHECK - Replace 'your-user-id-here' with your actual user ID
    const OWNER_USER_ID = 'your-user-id-here'; // TODO: Replace with your actual user ID
    
    if (!userProfile || user.id !== OWNER_USER_ID) {
      return NextResponse.json(
        { error: 'Admin access restricted to owner only' },
        { status: 403 }
      );
    }

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

