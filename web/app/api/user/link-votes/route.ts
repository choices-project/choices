import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import {
  withErrorHandling,
  successResponse,
  validationError,
  errorResponse,
} from '@/lib/api';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    logger.error('Missing Supabase credentials for link votes handler', {
      hasUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(serviceRoleKey),
    });
    return errorResponse('Supabase credentials are not configured', 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const body = await request.json();
  const { user_id, voter_session } = body;

  const validationErrors: Record<string, string> = {};
  if (!user_id) {
    validationErrors.user_id = 'User ID is required';
  }
  if (!voter_session) {
    validationErrors.voter_session = 'Voter session is required';
  }

  if (Object.keys(validationErrors).length > 0) {
    return validationError(validationErrors);
  }

  // Call the database function
  const { data: linkedCount, error } = await supabase.rpc(
    'link_anonymous_votes_to_user',
    {
      p_user_id: user_id,
      p_voter_session: voter_session,
    }
  );

  if (error) {
    logger.error('Link votes error', { error, userId: user_id });
    return errorResponse('Failed to link anonymous votes', 500, {
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }

  return successResponse(
    {
      linkedVotesCount: linkedCount ?? 0,
      userId: user_id,
      voterSession: voter_session,
    },
    undefined,
    201
  );
});
