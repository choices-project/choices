/**
 * PWA Offline Sync API Endpoint
 *
 * Handles syncing offline votes and data when users come back online.
 * Idempotent: skips votes when (poll_id, user_id) already exists to prevent duplicates.
 * Conflict policy: prefer online vote (skip sync if user already voted).
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, forbiddenError, validationError, authError } from '@/lib/api';
import { getUser } from '@/lib/core/auth/middleware';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('PWA')) {
    return forbiddenError('PWA feature is disabled');
  }

  const user = await getUser().catch(() => null);
  if (!user) {
    return authError('Authentication required to sync offline votes');
  }

  const body = await request.json();
  const { votes, deviceId, timestamp } = body;

  logger.info('Offline sync attempt', { deviceId, timestamp, userId: user.id });

  if (!votes || !Array.isArray(votes)) {
    return validationError({ votes: 'Invalid votes data' });
  }

  logger.info(`PWA: Syncing ${votes.length} offline votes from device ${deviceId}`);

  const results: Array<{ voteId: string; success: boolean; result?: unknown; error?: string }> = [];
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('PWA sync: Supabase not configured');
    return forbiddenError('Database not available');
  }

  for (const vote of votes) {
    try {
      if (!vote.pollId || !vote.optionIds || !Array.isArray(vote.optionIds)) {
        throw new Error('Invalid vote data structure');
      }

      const { skipped, result } = await processOfflineVote(supabase, user.id, vote);
      if (skipped) {
        skippedCount++;
        results.push({ voteId: vote.id, success: true, result: { skipped: true, reason: 'already_voted' } });
      } else {
        successCount++;
        results.push({ voteId: vote.id, success: true, result });
      }
    } catch (error) {
      logger.error(`PWA: Failed to sync vote ${vote.id}:`, error);
      results.push({
        voteId: vote.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      failureCount++;
    }
  }

  logger.info(`PWA: Sync completed - ${successCount} synced, ${skippedCount} skipped (already voted), ${failureCount} failed`);

  return successResponse(
    {
      syncedCount: successCount,
      skippedCount,
      failedCount: failureCount,
      results,
      timestamp: new Date().toISOString(),
    },
    undefined,
    201
  );
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Check if PWA feature is enabled
  if (!isFeatureEnabled('PWA')) {
    return forbiddenError('PWA feature is disabled');
  }

  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');

  if (!deviceId) {
    return validationError({ deviceId: 'Device ID is required' });
  }

  // Get sync status for device
  const syncStatus = await getSyncStatus(deviceId);

  return successResponse({
    deviceId,
    syncStatus,
    timestamp: new Date().toISOString()
  });
});

type SupabaseClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;

/**
 * Process a single offline vote with idempotency.
 * Skips if (poll_id, user_id) already has a vote (prefer online).
 */
async function processOfflineVote(
  supabase: NonNullable<SupabaseClient>,
  userId: string,
  vote: { id?: string; pollId: string; optionIds: string[] }
): Promise<{ skipped: boolean; result: unknown }> {
  const { pollId, optionIds } = vote;

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('id, status')
    .eq('id', pollId)
    .maybeSingle();

  if (pollError || !poll) {
    logger.warn('PWA sync: Poll not found', { pollId, error: pollError });
    throw new Error('Poll not found or no longer available');
  }

  if ((poll.status ?? 'active') !== 'active') {
    logger.info('PWA sync: Skipping vote for closed/draft poll', { pollId, status: poll.status });
    return { skipped: true, result: { pollId, reason: 'poll_not_active' } };
  }

  const { data: pollOptions, error: optionsError } = await supabase
    .from('poll_options')
    .select('id')
    .eq('poll_id', pollId);

  if (!optionsError && pollOptions) {
    const validIds = new Set(pollOptions.map((o) => o.id));
    const invalidIds = optionIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      logger.warn('PWA sync: Invalid option IDs for poll', { pollId, invalidIds });
      throw new Error('One or more options are not valid for this poll');
    }
  }

  const { data: existingVotes, error: checkError } = await supabase
    .from('votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('user_id', userId)
    .limit(1);

  if (checkError) {
    logger.error('PWA sync: Failed to check existing vote', { pollId, userId, error: checkError });
    throw new Error('Unable to verify voting history');
  }

  if (existingVotes && existingVotes.length > 0) {
    return { skipped: true, result: { pollId, reason: 'already_voted' } };
  }

  const validOptionIds = optionIds.filter((id): id is string => typeof id === 'string' && id.length > 0);
  if (validOptionIds.length === 0) {
    throw new Error('No valid option IDs');
  }

  const rowsToInsert = validOptionIds.map((optionId) => ({
    poll_id: pollId,
    option_id: optionId,
    poll_option_id: optionId,
    user_id: userId,
    vote_status: 'submitted' as const,
  }));

  const { error: insertError } = await supabase.from('votes').insert(rowsToInsert);

  if (insertError) {
    if (insertError.code === '23505') {
      return { skipped: true, result: { pollId, reason: 'duplicate_constraint' } };
    }
    logger.error('PWA sync: Vote insert failed', { pollId, userId, error: insertError });
    throw new Error(insertError.message ?? 'Failed to record vote');
  }

  return {
    skipped: false,
    result: {
      pollId,
      optionIds: validOptionIds,
      timestamp: new Date().toISOString(),
      processed: true,
    },
  };
}

/**
 * Get sync status for a device
 */
async function getSyncStatus(deviceId: string): Promise<any> {
  // This would typically query your database for pending sync operations
  // For now, we'll return a mock status
  logger.debug('Getting sync status for device', { deviceId });
  
  return {
    lastSync: new Date().toISOString(),
    pendingVotes: 0,
    status: 'up_to_date'
  };
}
