import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get Supabase client
    const supabaseClient = await supabase;
    
    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('ia_users')
      .select('verification_tier')
      .eq('stable_id', String(user.id) as any)
      .single();

    if (profileError) {
      devLog('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      );
    }

    if (!userProfile || !userProfile || !('verification_tier' in userProfile) || !['T2', 'T3'].includes(userProfile.verification_tier)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const feedbackId = params.id;
    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update feedback status
    const { data: updatedFeedback, error: updateError } = await supabaseClient
      .from('feedback')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', feedbackId as any)
      .select()
      .single();

    if (updateError) {
      devLog('Error updating feedback status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update feedback status' },
        { status: 500 }
      );
    }

    if (!updatedFeedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    devLog('Feedback status updated successfully', { 
      feedbackId, 
      newStatus, 
      updatedBy: user.id 
    });

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback status updated successfully'
    });

  } catch (error) {
    devLog('Error in feedback status update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
