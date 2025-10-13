import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { getUser } from '@/lib/core/auth/middleware';
import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// Type definitions for poll data
interface PollOption {
  id: string;
  text: string;
  votes?: number;
}

interface _PollData {
  id: string;
  title: string;
  total_votes: number;
  options: PollOption[];
  status: string;
}

// GET /api/polls - Get active polls with aggregated results only
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Route: Calling getSupabaseServerClient...');
    const supabaseClient = await getSupabaseServerClient();
    console.log('🔍 API Route: Supabase client result:', !!supabaseClient);
    
    if (!supabaseClient) {
      console.log('🔍 API Route: Supabase client is null/undefined');
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const _status = searchParams.get('status') || 'active';

    // Fetch active polls from polls table
    let polls;

    try {
      devLog('Fetching active polls from polls table...');
      const { data: directPolls, error: directError } = await supabaseClient
        .from('polls')
        .select('id, title, total_votes, options, status')
        .eq('status', 'active')
        .limit(limit);

      if (directError) {
        throw directError;
      }

      devLog('Found polls:', directPolls.length || 0);

      // Manually aggregate results (temporary solution)
      polls = (directPolls ?? []).map(poll => ({
        id: poll.id,
        title: poll.title,
        total_votes: poll.total_votes || 0,
        aggregated_results: Array.isArray(poll.options) ? 
          poll.options.reduce((acc: Record<string, number>, option: PollOption, index: number) => {
            acc[`option_${index + 1}`] = option.votes || 0;
            return acc;
          }, {}) : {},
        status: poll.status
      }));
    } catch (fallbackError) {
      devLog('Error fetching polls:', fallbackError);
      return NextResponse.json(
        { error: 'Failed to fetch polls' },
        { status: 500 }
      );
    }

    // Additional security: ensure no sensitive data is returned
    const sanitizedPolls = polls.map(poll => ({
      poll_id: poll.id,
      title: poll.title,
      total_votes: poll.total_votes,
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
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/polls - Create new poll (authenticated users only)
export async function POST(request: NextRequest) {
  try {
    // Always require authentication - no E2E bypasses
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    // Always require authentication
    let user;
    try {
      user = await getUser();
    } catch (error) {
      devLog('Authentication error during poll creation:', error);
      return NextResponse.json(
        { error: 'Authentication required to create polls' },
        { status: 401 }
      );
    }
    
    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to create polls' },
        { status: 401 }
      );
    }
    
    // Verify user is active
    if (user) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('is_active')
        .eq('user_id', user.id)
        .single();

      if (!userProfile || !('is_active' in userProfile) || !userProfile.is_active) {
        return NextResponse.json(
          { error: 'Active account required to create polls' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { 
      title, 
      options, 
      votingMethod = 'single',
      description,
      category = 'general',
      privacyLevel = 'public',
      allowMultipleVotes = false,
      showResults = true,
      allowComments = true,
      endTime,
      hashtags = [],
      primaryHashtag
    } = body;

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
      .from('polls')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        options: sanitizedOptions,
        voting_method: votingMethod,
        privacy_level: privacyLevel,
        category,
        status: 'active',
        created_by: user?.id || '',
        total_votes: 0,
        participation: 0,
        end_time: endTime || null,
        hashtags: hashtags || [],
        primary_hashtag: primaryHashtag || null,
        poll_settings: {
          allowMultipleVotes,
          showResults,
          allowComments
        }
      })
      .select()
      .single();

    if (pollError) {
      devLog('Error creating poll:', pollError);
      return NextResponse.json(
        { error: 'Failed to create poll', details: pollError },
        { status: 500 }
      );
    }

    // Return sanitized poll data (no sensitive information)
    const sanitizedPoll = poll && !('error' in poll) ? {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      options: poll.options,
      voting_method: poll.voting_method,
      privacy_level: poll.privacy_level,
      category: poll.category,
      status: poll.status,
      total_votes: poll.total_votes,
      participation: poll.participation,
      end_time: poll.end_time,
      hashtags: poll.hashtags || [],
      primary_hashtag: poll.primary_hashtag,
      poll_settings: poll.poll_settings,
      created_at: poll.created_at
    } : null;

    return NextResponse.json(sanitizedPoll);

  } catch (error) {
    devLog('Error in polls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
