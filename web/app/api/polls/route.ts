import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

// GET /api/polls - Get active polls with aggregated results only
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const _status = searchParams.get('status') || 'active';

    // Fetch active polls from po_polls table
    let polls;

    try {
      devLog('Fetching active polls from po_polls table...');
      const supabaseClient = await supabase;
      const { data: directPolls, error: directError } = await supabaseClient
        .from('po_polls')
        .select('poll_id, title, total_votes, participation_rate, options, status')
        .eq('status', 'active' as any)
        .limit(limit);

      if (directError) {
        throw directError;
      }

      devLog('Found polls:', directPolls?.length || 0);

      // Manually aggregate results (temporary solution)
      polls = directPolls && !('error' in directPolls) ? directPolls.filter(poll => 
        poll && 
        'poll_id' in poll && 
        'title' in poll && 
        'total_votes' in poll && 
        'participation_rate' in poll && 
        'options' in poll && 
        'status' in poll
      ).map(poll => ({
        poll_id: poll.poll_id,
        title: poll.title,
        total_votes: poll.total_votes || 0,
        participation_rate: poll.participation_rate || 0,
        aggregated_results: poll.options ? 
          poll.options.reduce((acc: any, _option: any, _index: any) => {
            acc[`option_${_index + 1}`] = 0; // Default to 0 until we can count votes
            return acc;
          }, {}) : {},
        status: poll.status
      })) : [];
    } catch (fallbackError) {
      devLog('Error fetching polls:', fallbackError);
      return NextResponse.json(
        { error: 'Failed to fetch polls' },
        { status: 500 }
      );
    }

    // Additional security: ensure no sensitive data is returned
    const sanitizedPolls = polls?.map(poll => ({
      poll_id: poll.poll_id,
      title: poll.title,
      total_votes: poll.total_votes,
      participation_rate: poll.participation_rate,
      aggregated_results: poll.aggregated_results,
      // Only include safe fields
      status: 'active', // Always show as active for public view
      created_at: new Date().toISOString(), // Generic timestamp
    })) || [];

    return NextResponse.json({
      success: true,
      polls: sanitizedPolls,
      count: sanitizedPolls.length,
      message: 'Aggregated poll results only - no individual vote data'
    });

  } catch (error) {
    devLog('Error in polls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/polls - Create new poll (authenticated users only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    // Check authentication
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to create polls' },
        { status: 401 }
      );
    }

    // Verify user is active
    const { data: userProfile } = await supabase
      .from('ia_users')
      .select('is_active')
      .eq('stable_id', user.userId as any)
      .single();

    if (!userProfile || !('is_active' in userProfile) || !userProfile.is_active) {
      return NextResponse.json(
        { error: 'Active account required to create polls' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, options, voting_method = 'single' } = body;

    // Validate required fields
    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'Title and at least 2 options are required' },
        { status: 400 }
      );
    }

    // Sanitize and validate options
    const sanitizedOptions = options
      .filter(option => typeof option === 'string' && option.trim().length > 0)
      .map(option => option.trim())
      .slice(0, 10); // Limit to 10 options max

    if (sanitizedOptions.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 valid options are required' },
        { status: 400 }
      );
    }

    // Create poll with user as creator
    const { data: poll, error: pollError } = await supabase
      .from('po_polls')
      .insert({
        title: title.trim(),
        description: body.description?.trim() || null,
        options: sanitizedOptions,
        voting_method,
        status: 'active',
        created_by: user.userId,
        total_votes: 0,
        participation_rate: 0.0
      } as any)
      .select()
      .single();

    if (pollError) {
      devLog('Error creating poll:', pollError);
      return NextResponse.json(
        { error: 'Failed to create poll' },
        { status: 500 }
      );
    }

    // Return sanitized poll data (no sensitive information)
    const sanitizedPoll = poll && !('error' in poll) ? {
      poll_id: (poll as any).poll_id,
      title: (poll as any).title,
      description: (poll as any).description,
      options: (poll as any).options,
      voting_method: (poll as any).voting_method,
      status: (poll as any).status,
      total_votes: (poll as any).total_votes,
      participation_rate: (poll as any).participation_rate,
      created_at: (poll as any).created_at
    } : null;

    return NextResponse.json({
      success: true,
      poll: sanitizedPoll,
      message: 'Poll created successfully'
    });

  } catch (error) {
    devLog('Error in polls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
