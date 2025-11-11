import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('Unauthorized cron attempt for hashtag notifications');
    return authError('Unauthorized');
  }

    const supabase = await getSupabaseServerClient();

    logger.info('Starting hashtag trending notifications cron job');

    // 1. Find recently trending hashtags (became trending in last day)
    // Since this now runs daily, check for hashtags that became trending since last run
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: trendingHashtags, error: hashtagError } = await supabase
      .from('hashtags')
      .select('id, name, trending_score, usage_count')
      .eq('is_trending', true)
      .gte('updated_at', oneDayAgo)  // Recently updated to trending (last 24 hours)
      .order('trending_score', { ascending: false })
      .limit(20);

  if (hashtagError) {
    logger.error('Error fetching trending hashtags:', hashtagError);
    return errorResponse('Failed to fetch trending hashtags', 500);
  }

    if (!trendingHashtags || trendingHashtags.length === 0) {
      logger.info('No new trending hashtags found');
      return NextResponse.json({
        success: true,
        message: 'No new trending hashtags',
        notificationsSent: 0
      });
    }

    logger.info(`Found ${trendingHashtags.length} trending hashtags`);

    let totalNotificationsSent = 0;

    // 2. For each trending hashtag, notify followers
    for (const hashtag of trendingHashtags) {
      // Get users who follow this hashtag
      const { data: followers, error: followerError } = await supabase
        .from('user_hashtags')
        .select('user_id')
        .eq('hashtag_id', hashtag.id);

      if (followerError || !followers || followers.length === 0) {
        continue;
      }

      logger.info(`Hashtag #${hashtag.name} has ${followers.length} followers`);

      // 3. Check if we've already notified these users recently (avoid spam)
      // Look for notifications sent in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      for (const follower of followers) {
        // Check if user was already notified about this hashtag trending
        const { data: existingNotification } = await (supabase as any)
          .from('notifications')
          .select('id')
          .eq('user_id', follower.user_id)
          .eq('notification_type', 'hashtag_trending')
          .gte('created_at', twentyFourHoursAgo)
          .contains('metadata', { hashtag_id: hashtag.id })
          .single();

        if (existingNotification) {
          continue;  // Already notified in last 24 hours
        }

        // Create notification
        const { error: notificationError } = await (supabase as any)
          .from('notifications')
          .insert({
            user_id: follower.user_id,
            title: `#${hashtag.name} is Trending!`,
            message: `The hashtag you follow #${hashtag.name} is currently trending with ${hashtag.usage_count} uses and a trending score of ${(hashtag.trending_score ?? 0).toFixed(1)}.`,
            notification_type: 'hashtag_trending',
            priority: 'normal',
            action_url: `/hashtags/${hashtag.name}`,
            metadata: {
              hashtag_id: hashtag.id,
              hashtag_name: hashtag.name,
              trending_score: hashtag.trending_score,
              usage_count: hashtag.usage_count
            },
            is_read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (notificationError) {
          logger.error(`Failed to create notification for user ${follower.user_id}:`, notificationError);
        } else {
          totalNotificationsSent++;
        }
      }
    }

    logger.info(`Hashtag trending notifications complete - sent ${totalNotificationsSent} notifications`);

  return successResponse({
    trendingHashtagsProcessed: trendingHashtags.length,
    notificationsSent: totalNotificationsSent
  });
});

