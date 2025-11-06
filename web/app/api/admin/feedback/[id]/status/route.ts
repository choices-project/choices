import type { NextRequest} from 'next/server';

import { withErrorHandling, successResponse, authError, errorResponse, forbiddenError, validationError } from '@/lib/api';
import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const supabaseClient = await supabase;
  
  if (!supabaseClient) {
    return errorResponse('Supabase client not available', 500);
  }

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return authError('Authentication required');
  }

  const { data: userProfile, error: profileError } = await (supabaseClient as any)
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', String(user.id))
    .single();

  if (profileError) {
    devLog('Error fetching user profile:', { error: profileError });
    return errorResponse('Failed to verify user permissions', 500);
  }

  if (!userProfile.is_admin) {
    return forbiddenError('Admin access required');
  }

  const feedbackId = String(id);
  if (!feedbackId) {
    return validationError({ feedbackId: 'Feedback ID is required' });
  }

  const body = await request.json();
  const { status: newStatus } = body;

  if (!newStatus) {
    return validationError({
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
    const { data: updatedFeedback, error: updateError } = await (supabaseClient as any)
      .from('feedback')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (updateError) {
      devLog('Error updating feedback status:', { error: updateError });
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
    devLog('Error in feedback status update API:', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
