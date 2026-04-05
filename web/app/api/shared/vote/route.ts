import { createClient } from '@supabase/supabase-js';

import { env } from '@/lib/config/env';
import { withErrorHandling, successResponse, validationError, notFoundError, errorResponse } from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const POST = withErrorHandling(async (request: NextRequest) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';
  const ua = request.headers.get('user-agent');
  const rateLimitOptions: { maxRequests: number; windowMs: number; userAgent?: string } = {
    maxRequests: 10,
    windowMs: 60 * 1000,
  };
  if (ua) rateLimitOptions.userAgent = ua;
  const rateLimitResult = await apiRateLimiter.checkLimit(ip, '/api/shared/vote', rateLimitOptions);
  if (!rateLimitResult.allowed) {
    return errorResponse('Too many requests. Please try again later.', 429);
  }

  const { poll_id, option_id, voter_session } = await request.json();
  
  if (!poll_id || !option_id || !voter_session) {
    return validationError({
      poll_id: !poll_id ? 'Poll ID is required' : '',
      option_id: !option_id ? 'Option ID is required' : '',
      voter_session: !voter_session ? 'Voter session is required' : ''
    });
  }

  if (typeof voter_session !== 'string' || !UUID_V4_REGEX.test(voter_session)) {
    return validationError({ voter_session: 'Voter session must be a valid UUID v4' });
  }

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are not configured');
    }
    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    );

    // Check if poll exists and is shareable (allows both public and private shared polls)
    // Private polls can be shared via link and allow anonymous voting for user acquisition
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, is_public, is_shareable, privacy_level, status')
      .eq('id', poll_id)
      .eq('is_shareable', true)
      .eq('status', 'active')
      .single();

  if (pollError || !poll) {
    return notFoundError('Poll not found or not shareable');
  }

  const { data: option, error: optionError } = await supabase
    .from('poll_options')
    .select('id')
    .eq('id', option_id)
    .eq('poll_id', poll_id)
    .single();

  if (optionError || !option) {
    return validationError({ option_id: 'Invalid option for this poll' });
  }

  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('poll_id', poll_id)
    .eq('voter_session', voter_session)
    .single();

  if (existingVote) {
    return errorResponse('You have already voted on this poll', 409);
  }

    // Create anonymous vote (equal weight)
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id,
        option_id,
        voter_session,
        trust_tier: 0, // Anonymous
        created_at: new Date().toISOString()
      })
      .select()
      .single();

  if (voteError) {
    logger.error('Vote creation error', { error: voteError });
    return errorResponse('Failed to record vote', 500);
  }

  return successResponse(
    {
      voteId: vote.id,
      message: 'Vote recorded successfully',
    },
    undefined,
    201
  );
});
