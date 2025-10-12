/**
 * PWA Offline Sync API Endpoint
 * 
 * Handles syncing offline votes and data when users come back online.
 * This endpoint is critical for the PWA offline functionality.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { createApiLogger } from '@/lib/utils/api-logger';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

// Types for offline sync
interface OfflineVote {
  id: string;
  pollId: string;
  optionIds: string[];
  userId: string;
  timestamp: string;
  deviceId: string;
  metadata?: Record<string, any>;
}

interface VoteSyncResult {
  voteId: string;
  success: boolean;
  result?: any;
  error?: string;
}

interface SyncStatus {
  lastSync: string;
  pendingVotes: number;
  status: 'up_to_date' | 'pending' | 'error';
  failedVotes?: string[];
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const apiLogger = createApiLogger('/api/pwa/offline/sync', 'POST');
  
  try {
    // Check if PWA feature is enabled
    if (!isFeatureEnabled('PWA')) {
      return NextResponse.json({
        success: false,
        error: 'PWA feature is disabled'
      }, { status: 403 });
    }

    const body = await request.json();
    const { votes, deviceId, timestamp, userId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required for offline sync'
      }, { status: 400 });
    }

    // Log sync attempt for audit trail
    apiLogger.info('Offline sync attempt', { deviceId, timestamp, userId });

    if (!votes || !Array.isArray(votes)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid votes data'
      }, { status: 400 });
    }

    logger.info(`PWA: Syncing ${votes.length} offline votes from device ${deviceId} for user ${userId}`);

    const results: VoteSyncResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each offline vote
    for (const vote of votes) {
      try {
        // Validate vote data structure
        if (!vote.pollId || !vote.optionIds || !Array.isArray(vote.optionIds) || !vote.userId) {
          throw new Error('Invalid vote data structure - missing required fields');
        }

        // Validate user ID matches
        if (vote.userId !== userId) {
          throw new Error('Vote user ID does not match authenticated user');
        }

        // Process the offline vote with full validation
        const result = await processOfflineVote(vote as OfflineVote);
        results.push({
          voteId: vote.id,
          success: true,
          result
        });
        successCount++;

      } catch (error) {
        logger.error(`PWA: Failed to sync vote ${vote.id}:`, error instanceof Error ? error : undefined);
        results.push({
          voteId: vote.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failureCount++;
      }
    }

    logger.info(`PWA: Sync completed - ${successCount} successful, ${failureCount} failed`);

    // Update sync status in database
    if (successCount > 0 || failureCount > 0) {
      await updateSyncStatus(deviceId, successCount, failureCount, results);
    }

    return NextResponse.json({
      success: true,
      syncedCount: successCount,
      failedCount: failureCount,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('PWA: Offline sync failed:', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to sync offline data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if PWA feature is enabled
    if (!isFeatureEnabled('PWA')) {
      return NextResponse.json({
        success: false,
        error: 'PWA feature is disabled'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json({
        success: false,
        error: 'Device ID is required'
      }, { status: 400 });
    }

    // Get sync status for device
    const syncStatus = await getSyncStatus(deviceId);

    return NextResponse.json({
      success: true,
      deviceId,
      syncStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('PWA: Failed to get sync status:', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get sync status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Process a single offline vote with full validation and database integration
 */
async function processOfflineVote(vote: OfflineVote): Promise<any> {
  const supabase = await getSupabaseServerClient();
  
  try {
    // 1. Validate the poll is still active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, status, closes_at, settings')
      .eq('id', vote.pollId)
      .single();

    if (pollError || !poll) {
      throw new Error(`Poll ${vote.pollId} not found or inaccessible`);
    }

    if (poll.status !== 'active') {
      throw new Error(`Poll ${vote.pollId} is no longer active (status: ${poll.status})`);
    }

    // Check if poll has closed
    if (poll.closes_at && new Date(poll.closes_at) < new Date()) {
      throw new Error(`Poll ${vote.pollId} has closed`);
    }

    // 2. Check if user hasn't already voted on this poll
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('votes')
      .select('id, created_at')
      .eq('poll_id', vote.pollId)
      .eq('user_id', vote.userId)
      .single();

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing votes: ${voteCheckError.message}`);
    }

    if (existingVote) {
      throw new Error(`User has already voted on poll ${vote.pollId}`);
    }

    // 3. Validate poll options exist and are valid
    const { data: pollOptions, error: optionsError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('poll_id', vote.pollId)
      .in('id', vote.optionIds);

    if (optionsError) {
      throw new Error(`Failed to validate poll options: ${optionsError.message}`);
    }

    if (!pollOptions || pollOptions.length !== vote.optionIds.length) {
      throw new Error('Invalid poll options selected');
    }

    // 4. Record the vote in the database
    const { data: newVote, error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: vote.pollId,
        user_id: vote.userId,
        option_ids: vote.optionIds,
        created_at: vote.timestamp,
        metadata: {
          ...vote.metadata,
          synced_from_offline: true,
          device_id: vote.deviceId,
          original_timestamp: vote.timestamp
        }
      })
      .select()
      .single();

    if (voteError) {
      throw new Error(`Failed to record vote: ${voteError.message}`);
    }

    // 5. Update poll statistics (this would typically be done via a database trigger)
    // For now, we'll log the successful vote
    logger.info('Offline vote successfully synced', {
      voteId: newVote.id,
      pollId: vote.pollId,
      userId: vote.userId,
      optionIds: vote.optionIds,
      syncedAt: new Date().toISOString()
    });

    return {
      voteId: newVote.id,
      pollId: vote.pollId,
      optionIds: vote.optionIds,
      timestamp: newVote.created_at,
      processed: true,
      syncedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Failed to process offline vote', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}

/**
 * Get sync status for a device with real database queries
 */
async function getSyncStatus(deviceId: string): Promise<SyncStatus> {
  const supabase = await getSupabaseServerClient();
  
  try {
    logger.info('Getting sync status for device', { deviceId });
    
    // Get the last sync timestamp for this device
    const { data: lastSync, error: syncError } = await supabase
      .from('device_sync_status')
      .select('last_sync, status, failed_votes')
      .eq('device_id', deviceId)
      .single();

    if (syncError && syncError.code !== 'PGRST116') {
      logger.error('Failed to get sync status', syncError);
      return {
        lastSync: new Date().toISOString(),
        pendingVotes: 0,
        status: 'error',
        failedVotes: []
      };
    }

    // Get pending offline votes for this device
    const { data: pendingVotes, error: votesError } = await supabase
      .from('offline_votes')
      .select('id')
      .eq('device_id', deviceId)
      .eq('synced', false);

    if (votesError) {
      logger.error('Failed to get pending votes', votesError);
      return {
        lastSync: lastSync?.last_sync || new Date().toISOString(),
        pendingVotes: 0,
        status: 'error',
        failedVotes: lastSync?.failed_votes || []
      };
    }

    const pendingCount = pendingVotes?.length || 0;
    const status: 'up_to_date' | 'pending' | 'error' = 
      pendingCount > 0 ? 'pending' : 
      lastSync?.status === 'error' ? 'error' : 
      'up_to_date';

    return {
      lastSync: lastSync?.last_sync || new Date().toISOString(),
      pendingVotes: pendingCount,
      status,
      failedVotes: lastSync?.failed_votes || []
    };

  } catch (error) {
    logger.error('Error getting sync status', error instanceof Error ? error : new Error('Unknown error'));
    
    return {
      lastSync: new Date().toISOString(),
      pendingVotes: 0,
      status: 'error',
      failedVotes: []
    };
  }
}

/**
 * Update sync status in database after sync operation
 */
async function updateSyncStatus(
  deviceId: string, 
  successCount: number, 
  failureCount: number, 
  results: VoteSyncResult[]
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  
  try {
    const failedVoteIds = results
      .filter(result => !result.success)
      .map(result => result.voteId);

    const { error } = await supabase
      .from('device_sync_status')
      .upsert({
        device_id: deviceId,
        last_sync: new Date().toISOString(),
        status: failureCount > 0 ? 'error' : 'up_to_date',
        failed_votes: failedVoteIds,
        success_count: successCount,
        failure_count: failureCount,
        updated_at: new Date().toISOString()
      });

    if (error) {
      logger.error('Failed to update sync status', error);
    } else {
      logger.info('Sync status updated successfully');
    }

  } catch (error) {
    logger.error('Error updating sync status', error instanceof Error ? error : new Error('Unknown error'));
  }
}
