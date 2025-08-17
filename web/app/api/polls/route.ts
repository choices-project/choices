import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getMockPollsResponse } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // If Supabase client is not available, return mock data
    if (!supabase) {
      console.log('Supabase client not available, using mock data');
      return NextResponse.json(getMockPollsResponse());
    }
    
    try {
      const { data, error } = await supabase
        .from('po_polls')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase data to match expected format
      const polls = data?.map(poll => ({
        id: poll.poll_id,
        question: poll.title,
        options: poll.options || [],
        totalVotes: poll.total_votes || 0,
        results: {}, // Will be calculated from votes
        expiresAt: poll.end_time,
        category: 'Community', // Default category
        isActive: poll.status === 'active',
        description: poll.description,
        createdBy: 'Community'
      })) || [];

      return NextResponse.json({ polls });
    } catch (error) {
      console.error('Supabase error:', error);
      // Fallback to mock data
      return NextResponse.json(getMockPollsResponse());
    }
  } catch (error) {
    console.error('Error in polls API:', error);
    // Always return mock data as final fallback
    return NextResponse.json(getMockPollsResponse());
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      votingMethod,
      options,
      settings,
      schedule
    } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Poll title is required' },
        { status: 400 }
      );
    }

    if (!options || options.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 options are required' },
        { status: 400 }
      );
    }

    // Validate options have text
    const emptyOptions = options.filter((option: any) => !option.text?.trim());
    if (emptyOptions.length > 0) {
      return NextResponse.json(
        { error: 'All options must have text' },
        { status: 400 }
      );
    }

    // Create poll data
    const pollData = {
      poll_id: `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      description: description?.trim() || null,
      options: options.map((option: any) => ({
        id: option.id,
        text: option.text.trim(),
        description: option.description?.trim() || null
      })),
      voting_method: votingMethod || 'single',
      voting_settings: settings || {},
      start_time: `${schedule.startDate}T${schedule.startTime}:00`,
      end_time: `${schedule.endDate}T${schedule.endTime}:00`,
      status: 'active',
      created_by: user.id,
      ia_public_key: 'mock_key_for_now', // TODO: Implement proper key generation
      total_votes: 0,
      participation_rate: 0,
      sponsors: [],
      created_at: new Date().toISOString()
    };

    // Insert poll into database
    const { data: poll, error: insertError } = await supabase
      .from('po_polls')
      .insert([pollData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating poll:', insertError);
      return NextResponse.json(
        { error: 'Failed to create poll' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Poll created successfully',
      poll: {
        id: poll.poll_id,
        title: poll.title,
        description: poll.description,
        votingMethod: poll.voting_method,
        options: poll.options,
        settings: poll.voting_settings,
        startTime: poll.start_time,
        endTime: poll.end_time,
        status: poll.status,
        createdBy: user.id,
        totalVotes: poll.total_votes,
        participationRate: poll.participation_rate
      }
    });

  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
