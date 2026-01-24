/**
 * Civic Actions Integration Utilities
 *
 * Utilities for integrating civic actions with feeds, representatives, and other features
 *
 * Feature Flag: CIVIC_ENGAGEMENT_V2
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { CIVIC_ACTION_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

import type { CivicAction } from '@/types/database';

type CivicActionRecord = CivicAction & {
  is_public?: boolean | null;
  urgency_level?: string | null;
  target_representatives?: number[] | null;
  current_signatures?: number | null;
  required_signatures?: number | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Create a feed item for a civic action
 */
export async function createCivicActionFeedItem(
  actionId: string,
  userId: string
): Promise<boolean> {
  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return false;
  }

  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Failed to get Supabase client for creating feed item');
      return false;
    }

    // Get the civic action
    const { data: actionData, error: actionError } = await supabase
      .from('civic_actions')
      .select(CIVIC_ACTION_SELECT_COLUMNS)
      .eq('id', actionId)
      .single();

    const action = (actionData ?? null) as CivicActionRecord | null;

    if (actionError || !action) {
      logger.error('Civic action not found for feed item creation', actionError);
      return false;
    }

    // Only create feed items for public, active actions
    if (!action.is_public || action.status !== 'active') {
      logger.debug('Skipping feed item creation for non-public or inactive action');
      return false;
    }

    // Create feed item
    const { error: feedError } = await supabase.from('feed_items').insert({
      feed_id: userId, // User's personal feed
      item_type: 'civic_action',
      item_id: actionId,
      title: action.title,
      description: action.description,
      metadata: {
        action_type: action.action_type,
        category: action.category,
        urgency_level: action.urgency_level,
        signature_count: action.current_signatures ?? 0,
        required_signatures: action.required_signatures,
      },
      created_by: action.created_by,
    });

    if (feedError) {
      logger.error('Error creating feed item for civic action', feedError);
      return false;
    }

    logger.info('Feed item created for civic action', { actionId, userId });
    return true;
  } catch (error) {
    logger.error('Unexpected error creating feed item', error);
    return false;
  }
}

/**
 * Link civic action to representative(s)
 */
export async function linkCivicActionToRepresentatives(
  actionId: string,
  representativeIds: number[]
): Promise<boolean> {
  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return false;
  }

  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Failed to get Supabase client for linking representatives');
      return false;
    }

    // Update the civic action with target representatives
    const { error } = await supabase
      .from('civic_actions')
      .update({ target_representatives: representativeIds } as unknown as Partial<CivicAction>)
      .eq('id', actionId);

    if (error) {
      logger.error('Error linking representatives to civic action', error);
      return false;
    }

    logger.info('Representatives linked to civic action', {
      actionId,
      representativeIds,
    });

    return true;
  } catch (error) {
    logger.error('Unexpected error linking representatives', error);
    return false;
  }
}

/**
 * Get civic actions for a specific representative
 */
export async function getCivicActionsForRepresentative(
  representativeId: number,
  limit: number = 10
): Promise<CivicActionRecord[]> {
  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return [];
  }

  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Failed to get Supabase client');
      return [];
    }

    const { data, error } = await supabase
      .from('civic_actions')
      .select(CIVIC_ACTION_SELECT_COLUMNS)
      .contains('target_representatives', [representativeId])
      .eq('status', 'active')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching civic actions for representative', error);
      return [];
    }

    return (data ?? []) as CivicActionRecord[];
  } catch (error) {
    logger.error('Unexpected error fetching civic actions', error);
    return [];
  }
}

/**
 * Get trending civic actions for feed integration
 */
export async function getTrendingCivicActionsForFeed(
  limit: number = 5,
  category?: string
): Promise<CivicActionRecord[]> {
  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return [];
  }

  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return [];
    }

    let query = supabase
      .from('civic_actions')
      .select(CIVIC_ACTION_SELECT_COLUMNS)
      .eq('status', 'active')
      .eq('is_public', true)
      .order('current_signatures', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching trending civic actions', error);
      return [];
    }

    return (data ?? []) as CivicActionRecord[];
  } catch (error) {
    logger.error('Unexpected error fetching trending actions', error);
    return [];
  }
}

