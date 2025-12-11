import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandling(async () => {
  const supabase = await getSupabaseServerClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return authError('User not authenticated');
  }

  const { error: updateError } = await (supabase as any)
    .from('user_profiles')
    .update({ 
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    logger.error('Error updating onboarding status', { error: updateError });
    return errorResponse('Failed to complete onboarding', 500);
  }

  return successResponse({ 
    message: 'Onboarding completed successfully' 
  });
});

