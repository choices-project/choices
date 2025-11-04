/**
 * Hashtag Notification Service
 * 
 * Integrates hashtag system with notification system for trending alerts.
 * 
 * Created: November 03, 2025
 */

import { logger } from '@/lib/utils/logger';

/**
 * Notify a user that a followed hashtag is trending
 * 
 * @param userId - User to notify
 * @param hashtagId - Trending hashtag ID
 * @param hashtagName - Hashtag name (without #)
 * @param trendingScore - Current trending score
 * @param usageCount - Current usage count
 */
export async function notifyHashtagTrending(
  userId: string,
  hashtagId: string,
  hashtagName: string,
  trendingScore: number,
  usageCount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Call notification API to create the notification
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        title: `#${hashtagName} is Trending!`,
        message: `The hashtag you follow #${hashtagName} is currently trending with ${usageCount} uses and a trending score of ${trendingScore.toFixed(1)}.`,
        notification_type: 'hashtag_trending',
        priority: 'normal',
        action_url: `/hashtags/${hashtagName}`,
        metadata: {
          hashtag_id: hashtagId,
          hashtag_name: hashtagName,
          trending_score: trendingScore,
          usage_count: usageCount
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error ?? 'Failed to create notification');
    }

    logger.info(`Sent trending notification for #${hashtagName} to user ${userId}`);
    return { success: true };

  } catch (error) {
    logger.error('Error sending hashtag trending notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check if user should be notified about hashtag (avoid spam)
 * 
 * @param userId - User ID
 * @param hashtagId - Hashtag ID
 * @returns True if notification should be sent
 */
export async function shouldNotifyHashtagTrending(
  userId: string,
  hashtagId: string
): Promise<boolean> {
  try {
    // Check for recent notifications (last 24 hours)
    const response = await fetch(`/api/notifications?unread_only=false&limit=100`);
    
    if (!response.ok) {
      return true;  // If can't check, allow notification
    }

    const data = await response.json();
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    // Check if already notified about this hashtag in last 24 hours
    const recentNotification = data.notifications?.find((n: any) => 
      n.notification_type === 'hashtag_trending' &&
      n.metadata?.hashtag_id === hashtagId &&
      new Date(n.created_at).getTime() > twentyFourHoursAgo
    );

    return !recentNotification;  // Notify if no recent notification

  } catch (error) {
    logger.error('Error checking notification eligibility:', error);
    return true;  // If error, allow notification
  }
}

