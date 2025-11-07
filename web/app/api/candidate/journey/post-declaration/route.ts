import type { NextRequest } from 'next/server'

import { withErrorHandling, successResponse, authError, errorResponse, validationError, notFoundError } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

  if (userError || !authUser) {
    return authError('Authentication required');
  }

  const body = await request.json()
  const { platformId } = body

  if (!platformId) {
    return validationError({ platformId: 'Platform ID required' });
  }

    // Get platform
    const { data: platform, error: platformError } = await supabase
      .from('candidate_platforms')
      .select('*, user_profiles(email)')
      .eq('id', platformId)
      .eq('user_id', authUser.id)
      .single()

  if (platformError || !platform) {
    return notFoundError('Platform not found');
  }

    // Welcome email sending for candidate journey
    // For now, just log and return success
    // Email implementation would go here:
    // - Welcome email template
    // - Next steps checklist
    // - Links to dashboard
    // - Filing requirements link

    // Mark platform as having received welcome (for future: track email sends)
    // Could add a column like `welcome_email_sent_at` to track

  return successResponse({
    message: 'Post-declaration flow initiated',
    nextSteps: [
      'Review filing requirements for your office',
      'Calculate your filing deadline',
      'Gather required documents',
      'Start filing process'
    ]
  }, undefined, 201);
});

