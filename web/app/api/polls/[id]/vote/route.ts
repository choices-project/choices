import { NextRequest, NextResponse } from 'next/server'
import { devLog } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { HybridVotingService } from '@/lib/hybrid-voting-service';

export const dynamic = 'force-dynamic';

// POST /api/polls/[id]/vote - Submit a vote (authenticated users only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const pollId = params.id;

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to vote' },
        { status: 401 }
      );
    }

    // Verify user is active
    const { data: userProfile, error: profileError } = await supabase
      .from('ia_users')
      .select('is_active')
      .eq('stable_id', user.id)
      .single();

    if (!userProfile || !userProfile.is_active) {
      return NextResponse.json(
        { error: 'Active account required to vote' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { choice, privacy_level = 'public' } = body;

    // Validate choice
    if (!choice || typeof choice !== 'number' || choice < 1) {
      return NextResponse.json(
        { error: 'Valid choice is required' },
        { status: 400 }
      );
    }

    // Use hybrid voting service
    const votingService = new HybridVotingService();
    const voteRequest = {
      pollId,
      choice,
      privacyLevel: privacy_level,
      userId: user.id
    };

    const response = await votingService.submitVote(voteRequest);

    if (!response.success) {
      return NextResponse.json(
        { error: response.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: response.message,
      poll_id: pollId,
      privacy_level: response.privacyLevel,
      response_time: response.responseTime,
      audit_receipt: response.auditReceipt,
      vote_confirmed: true
    });

  } catch (error) {
    devLog('Error in vote API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/polls/[id]/vote - Check if user has voted (returns boolean only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const pollId = params.id;

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { has_voted: false },
        { status: 200 }
      );
    }

    // Check if user has voted (returns boolean only, no vote data)
    const { data: existingVote, error: voteError } = await supabase
      .from('po_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      has_voted: !!existingVote,
      // Do NOT return any vote details for privacy
    });

  } catch (error) {
    devLog('Error checking vote status:', error);
    return NextResponse.json(
      { has_voted: false },
      { status: 200 }
    );
  }
}
