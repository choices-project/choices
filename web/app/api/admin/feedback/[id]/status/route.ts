import { getSupabaseServerClient } from '@/utils/supabase/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';

import { withErrorHandling, successResponse, errorResponse, validationError, notFoundError } from '@/lib/api';
import { devLog } from '@/lib/utils/logger';

import type { NextRequest} from 'next/server';



export const dynamic = 'force-dynamic';

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authGate = await requireAdminOr401(request);
  if (authGate) return authGate;

  const { id } = await params;
  const supabaseClient = await getSupabaseServerClient();

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
  });

  return successResponse({
    data: updatedFeedback,
    message: 'Feedback status updated successfully'
  });
});
