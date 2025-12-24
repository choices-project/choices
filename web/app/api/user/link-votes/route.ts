import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import {
  withErrorHandling,
  successResponse,
  validationError,
  errorResponse,
} from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

// Validation schema for link votes request
const linkVotesSchema = z.object({
  user_id: z.string().uuid('User ID must be a valid UUID'),
  voter_session: z.string().min(1, 'Voter session is required'),
});

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

  // Parse and validate request body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return validationError({ body: 'Request body must be valid JSON' });
  }

  // Validate with Zod schema
  const validationResult = linkVotesSchema.safeParse(rawBody);
  if (!validationResult.success) {
    const fieldErrors: Record<string, string> = {};
    validationResult.error.issues.forEach((issue) => {
      const field = issue.path[0] as string || 'body';
      fieldErrors[field] = issue.message;
    });
    return validationError(fieldErrors, 'Invalid link votes data');
  }

  const { user_id, voter_session } = validationResult.data;

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
