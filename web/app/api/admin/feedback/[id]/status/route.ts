import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, errorResponse, forbiddenError, validationError, notFoundError } from '@/lib/api';
import { devLog } from '@/lib/utils/logger';

import type { NextRequest} from 'next/server';



export const dynamic = 'force-dynamic';

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const supabaseClient = await getSupabaseServerClient();

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
    return validationError({ status: 'Status is required' });
  }

  const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(newStatus)) {
    return validationError({ status: 'Invalid status value' });
  }

  const { data: updatedFeedback, error: updateError } = await (supabaseClient as any)
    .from('feedback')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', feedbackId)
    .select('id, status, updated_at')
    .single();

  if (updateError) {
    devLog('Error updating feedback status:', { error: updateError });
    return errorResponse('Failed to update feedback status', 500);
  }

  if (!updatedFeedback) {
    return notFoundError('Feedback not found');
  }

  devLog('Feedback status updated successfully', { 
    feedbackId, 
    newStatus, 
    updatedBy: user.id 
  });

  return successResponse({
    data: updatedFeedback,
    message: 'Feedback status updated successfully'
  });
});
