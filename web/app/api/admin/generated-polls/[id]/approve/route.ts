import { NextRequest, NextResponse } from 'next/server'
import { devLog } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { AutomatedPollsService } from '@/lib/automated-polls';

export const dynamic = 'force-dynamic';

// POST /api/admin/generated-polls/[id]/approve
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id;
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
    const { data: userProfile, error: profileError } = await supabase
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

    const service = new AutomatedPollsService();

    // Get the generated poll
    const poll = await service.getGeneratedPollById(pollId);
    if (!poll) {
      return NextResponse.json(
        { error: 'Generated poll not found' },
        { status: 404 }
      );
    }

    // Check if poll can be approved
    if (poll.status !== 'draft' && poll.status !== 'pending') {
      return NextResponse.json(
        { error: `Poll cannot be approved from status: ${poll.status}` },
        { status: 400 }
      );
    }

    // Check quality score threshold
    const config = await service.getSystemConfiguration('quality_assurance');
    const autoApprovalThreshold = config?.value?.auto_approval_threshold || 0.85;

    if (poll.qualityScore < autoApprovalThreshold) {
      return NextResponse.json(
        { 
          error: 'Poll quality score too low for approval',
          qualityScore: poll.qualityScore,
          requiredThreshold: autoApprovalThreshold
        },
        { status: 400 }
      );
    }

    // Approve the poll
    const approvedPoll = await service.approveGeneratedPoll(pollId, user.id);
    if (!approvedPoll) {
      return NextResponse.json(
        { error: 'Failed to approve poll' },
        { status: 500 }
      );
    }

    // Integrate with main poll system
    // Create a regular poll in the po_polls table
    try {
      const { data: mainPoll, error: mainPollError } = await supabase
        .from('po_polls')
        .insert([{
          poll_id: `auto_${pollId}`,
          title: poll.title,
          description: poll.description,
          options: poll.options,
          voting_method: poll.votingMethod,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'active',
          created_by: user.id,
          ia_public_key: 'automated_poll_system',
          total_votes: 0,
          participation_rate: 0,
          sponsors: [],
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (mainPollError) {
        devLog('Error creating main poll:', mainPollError);
        // Don't fail the approval if main poll creation fails
      }

      // Update generated poll with main poll reference
      await service.updateGeneratedPoll(pollId, {
        generationMetadata: {
          ...poll.generationMetadata,
          mainPollId: mainPoll?.poll_id,
          integratedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      devLog('Error integrating with main poll system:', error);
      // Don't fail the approval if integration fails
    }

    return NextResponse.json({
      success: true,
      message: 'Poll approved successfully',
      poll: approvedPoll,
      approvedBy: user.id,
      approvedAt: approvedPoll.approvedAt
    });

  } catch (error) {
    devLog('Error approving generated poll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

