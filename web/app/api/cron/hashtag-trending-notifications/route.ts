/**
 * Hashtag Trending Notifications Cron Job
 * 
 * Checks for trending hashtags and notifies users who follow them.
 * Runs periodically via cron trigger.
 * 
 * Created: November 03, 2025
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Cron job to send trending hashtag notifications
 * 
 * Algorithm:
 * 1. Find hashtags that recently became trending (is_trending = true, trending_since < 1 hour ago)
 * 2. For each trending hashtag, find users who follow it
 * 3. Create notification for each user (if they haven't been notified recently)
 * 4. Track notification sent to avoid spamming
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (basic auth check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron attempt for hashtag notifications');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseServerClient();

    logger.info('Starting hashtag trending notifications cron job');

    // 1. Find recently trending hashtags (became trending in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: trendingHashtags, error: hashtagError } = await supabase
      .from('hashtags')
      .select('id, name, trending_score, usage_count')
      .eq('is_trending', true)
      .gte('updated_at', oneHourAgo)  // Recently updated to trending
      .order('trending_score', { ascending: false })
      .limit(20);

    if (hashtagError) {
      logger.error('Error fetching trending hashtags:', hashtagError);
      return NextResponse.json({ error: 'Failed to fetch trending hashtags' }, { status: 500 });
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
        const { data: existingNotification } = await supabase
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
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: follower.user_id,
            title: `#${hashtag.name} is Trending!`,
            message: `The hashtag you follow #${hashtag.name} is currently trending with ${hashtag.usage_count} uses and a trending score of ${hashtag.trending_score.toFixed(1)}.`,
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

    return NextResponse.json({
      success: true,
      trendingHashtagsProcessed: trendingHashtags.length,
      notificationsSent: totalNotificationsSent
    });

  } catch (error) {
    logger.error('Hashtag trending notifications cron error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

