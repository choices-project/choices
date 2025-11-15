import type { NextRequest } from 'next/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';
import {
  authError,
  errorResponse,
  forbiddenError,
  notFoundError,
  successResponse,
  validationError,
  withErrorHandling,
} from '@/lib/api';
import { RealTimeNewsService } from '@/lib/core/services/real-time-news';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/admin/breaking-news/[id]/poll-context - Generate poll context from breaking news story
export const POST = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const supabaseClient = await getSupabaseServerClient();
  if (!supabaseClient) {
    return errorResponse('Database connection not available', 500);
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return authError('Authentication required');
  }

  const { data: userProfile } = await supabaseClient
    .from('user_profiles')
    .select('trust_tier')
    .eq('user_id', user.id)
    .single();

  if (!userProfile) {
    return forbiddenError('Admin access restricted to owner only');
  }

  const storyId = params.id;
  if (!storyId) {
    return validationError({ storyId: 'Story ID is required' });
  }

  const service = new RealTimeNewsService();

  const story = await service.getBreakingNewsById(storyId);
  if (!story) {
    return notFoundError('Breaking news story not found');
  }

  const pollContext = await service.generatePollContext(storyId);
  if (!pollContext) {
    return errorResponse('Failed to generate poll context', 500);
  }

  return successResponse({
    pollContext,
    story: {
      id: story.id,
      headline: story.headline,
      summary: story.summary,
      urgency: story.urgency,
      sentiment: story.sentiment,
    },
    message: 'Poll context generated successfully',
  });
});

// GET /api/admin/breaking-news/[id]/poll-context - Get existing poll context for a story
export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const supabaseClient = await getSupabaseServerClient();
  if (!supabaseClient) {
    return errorResponse('Supabase client not available', 500);
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return authError('Authentication required');
  }

  const { data: userProfile, error: profileError } = await supabaseClient
    .from('user_profiles')
    .select('trust_tier')
    .eq('user_id', user.id)
    .single();

  if (profileError || !userProfile) {
    logger.error('Error fetching user profile:', profileError);
    return errorResponse('Failed to verify user permissions', 500);
  }

  if (!userProfile.trust_tier || !['T2', 'T3'].includes(userProfile.trust_tier)) {
    return forbiddenError('Insufficient permissions');
  }

  const storyId = params.id;
  if (!storyId) {
    return validationError({ storyId: 'Story ID is required' });
  }

  const service = new RealTimeNewsService();
  const story = await service.getBreakingNewsById(storyId);

  return successResponse({
    pollContext: null,
    story: story
      ? {
          id: story.id,
          headline: story.headline,
          summary: story.summary,
          urgency: story.urgency,
          sentiment: story.sentiment,
        }
      : null,
    hasExistingContext: false,
  });
});
