import { createClient } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();
  const { user_id, voter_session } = body;

  if (!user_id || !voter_session) {
    return validationError({ 
      user_id: !user_id ? 'User ID is required' : '',
      voter_session: !voter_session ? 'Voter session is required' : ''
    });
  }

    // Call the database function
    const { data: linkedCount, error } = await supabase.rpc('link_anonymous_votes_to_user', {
      p_user_id: user_id,
      p_voter_session: voter_session
    });

  if (error) {
    logger.error('Link votes error', { error, userId: user_id });
    return errorResponse('Failed to link anonymous votes', 500, error.message);
  }

  return successResponse({
    linked_votes_count: linkedCount,
    user_id: user_id,
    voter_session: voter_session,
    timestamp: new Date().toISOString()
  }, undefined, 201);
});
