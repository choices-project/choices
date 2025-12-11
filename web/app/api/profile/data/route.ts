/**
 * Specific Data Deletion API
 * 
 * Granular control over data deletion
 * Allows users to delete specific categories of data without deleting entire account
 * 
 * 🔒 PRIVACY: User control over specific data types
 * Based on ACTUAL database schema
 * 
 * Created: November 5, 2025
 * Status: ✅ ACTIVE - PRODUCTION READY
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, errorResponse, validationError } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';



export const dynamic = 'force-dynamic';

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  
  if (!supabase) {
    return errorResponse('Supabase not configured', 500);
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    return authError('User not authenticated');
  }
  
  const user = session.user;
  const userId = user.id;

  const { searchParams } = new URL(request.url);
  const dataType = searchParams.get('type');

  if (!dataType) {
    return validationError({ type: 'Data type parameter required' });
  }

    logger.info('Specific data deletion requested', { userId, dataType });

    let deletionResult: { count: number; description: string } = {
      count: 0,
      description: ''
    };

    // Handle each data type based on ACTUAL schema
    switch (dataType) {
      case 'location': {
        // Location data is stored in demographics field of user_profiles
        const { error } = await supabase
          .from('user_profiles')
          .update({ demographics: null })
          .eq('id', userId);

        if (error) {
          logger.error('Location data deletion failed', error);
          throw new Error('Failed to delete location data');
        }
        
        deletionResult = {
          count: 1,
          description: 'Location data cleared from demographics'
        };
        logger.info('Location data deleted successfully', { userId });
        break;
      }

      case 'voting': {
        // Delete all voting records from votes table
        const { error, count } = await supabase
          .from('votes')
          .delete({ count: 'exact' })
          .eq('user_id', userId);

        if (error) {
          logger.error('Voting history deletion failed', error);
          throw new Error('Failed to delete voting history');
        }
        
        deletionResult = {
          count: count ?? 0,
          description: `Deleted ${count ?? 0} voting records`
        };
        logger.info('Voting history deleted successfully', { userId, count });
        break;
      }

      case 'interests': {
        // Delete hashtag interests from user_hashtags table
        const { error, count } = await supabase
          .from('user_hashtags')
          .delete({ count: 'exact' })
          .eq('user_id', userId);

        if (error) {
          logger.error('Hashtag interests deletion failed', error);
          throw new Error('Failed to delete hashtag interests');
        }

        // Also delete hashtag-related analytics events
        const { error: analyticsError, count: analyticsCount } = await supabase
          .from('analytics_events')
          .delete({ count: 'exact' })
          .eq('user_id', userId)
          .eq('event_category', 'hashtag');

        if (analyticsError) {
          logger.warn('Failed to delete hashtag analytics events', analyticsError);
        }
        
        const totalCount = (count ?? 0) + (analyticsCount ?? 0);
        deletionResult = {
          count: totalCount,
          description: `Deleted ${count ?? 0} hashtag interests and ${analyticsCount ?? 0} analytics events`
        };
        logger.info('Hashtag interests deleted successfully', { userId, hashtagCount: count, analyticsCount });
        break;
      }

      case 'feed-interactions': {
        // Delete feed interactions from feed_interactions table
        const { error, count } = await supabase
          .from('feed_interactions')
          .delete({ count: 'exact' })
          .eq('user_id', userId);

        if (error) {
          logger.error('Feed interactions deletion failed', error);
          throw new Error('Failed to delete feed interactions');
        }

        // Also delete feed-related analytics events
        const { error: analyticsError, count: analyticsCount } = await supabase
          .from('analytics_events')
          .delete({ count: 'exact' })
          .eq('user_id', userId)
          .in('event_category', ['feed', 'content']);

        if (analyticsError) {
          logger.warn('Failed to delete feed analytics events', analyticsError);
        }
        
        const totalCount = (count ?? 0) + (analyticsCount ?? 0);
        deletionResult = {
          count: totalCount,
          description: `Deleted ${count ?? 0} feed interactions and ${analyticsCount ?? 0} analytics events`
        };
        logger.info('Feed interactions deleted successfully', { userId, feedCount: count, analyticsCount });
        break;
      }

      case 'analytics': {
        // Delete all analytics events from analytics_events table
        const { error, count } = await supabase
          .from('analytics_events')
          .delete({ count: 'exact' })
          .eq('user_id', userId);

        if (error) {
          logger.error('Analytics deletion failed', error);
          throw new Error('Failed to delete analytics data');
        }
        
        deletionResult = {
          count: count ?? 0,
          description: `Deleted ${count ?? 0} analytics events`
        };
        logger.info('Analytics data deleted successfully', { userId, count });
        break;
      }

      case 'representatives': {
        // Delete representative interactions from analytics_events
        const { error, count } = await supabase
          .from('analytics_events')
          .delete({ count: 'exact' })
          .eq('user_id', userId)
          .eq('event_category', 'representative');

        if (error) {
          logger.error('Representative interactions deletion failed', error);
          throw new Error('Failed to delete representative interactions');
        }
        
        deletionResult = {
          count: count ?? 0,
          description: `Deleted ${count ?? 0} representative interactions`
        };
        logger.info('Representative interactions deleted successfully', { userId, count });
        break;
      }

      case 'search': {
        // Delete search history from analytics_events (event_type='search')
        const { error, count } = await supabase
          .from('analytics_events')
          .delete({ count: 'exact' })
          .eq('user_id', userId)
          .eq('event_type', 'search');

        if (error) {
          logger.error('Search history deletion failed', error);
          throw new Error('Failed to delete search history');
        }
        
        deletionResult = {
          count: count ?? 0,
          description: `Deleted ${count ?? 0} search history entries`
        };
        logger.info('Search history deleted successfully', { userId, count });
        break;
      }

      default:
        return validationError({ 
          type: `Unknown data type: ${dataType}. Supported types: location, voting, interests, feed-interactions, analytics, representatives, search` 
        });
    }

    return successResponse({
      message: deletionResult.description,
      deletedCount: deletionResult.count,
      dataType: dataType
    });
});
