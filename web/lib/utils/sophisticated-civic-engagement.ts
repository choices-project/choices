/**
 * @fileoverview Civic Engagement Utilities
 *
 * STATUS: RARELY USED, FEATURE-GATED (CIVIC_ENGAGEMENT_V2)
 * Ownership: Civic/Integrations
 * Notes:
 * - Access is explicitly gated by feature flag to avoid accidental usage spread.
 * - Keep API surface minimal; prefer higher-level services for production pathways.
 *
 * Civic engagement utilities for representative integration, petition management, and civic action tracking.
 *
 * This module provides civic engagement capabilities including:
 * - Representative integration with OpenStates data
 * - Petition creation and management
 * - Campaign tracking and signature collection
 * - Trust scoring and community impact analysis
 * - Civic engagement recommendations
 *
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';
import type { TrustTier } from '@/types/features/analytics';
import type { CivicAction } from '@/types/database';
import { getSupabaseServerClient } from '@/utils/supabase/server';


const CIVIC_ENGAGEMENT_FLAG = 'CIVIC_ENGAGEMENT_V2' as const;

function assertCivicEngagementEnabled(context: string): void {
  if (!isFeatureEnabled(CIVIC_ENGAGEMENT_FLAG)) {
    logger.warn('[CivicEngagementV2] Blocked call while feature disabled', { context });
    throw new Error('Civic engagement v2 feature is disabled');
  }
}


/**
 * Sophisticated civic action types supported by our platform
 *
 * These action types enable comprehensive civic engagement including
 * petitions, campaigns, surveys, events, protests, and meetings.
 *
 * @typedef {string} CivicActionType
 */
export type CivicActionType = 'petition' | 'campaign' | 'survey' | 'event' | 'protest' | 'meeting';

/**
 * Urgency levels for civic actions
 *
 * These urgency levels help prioritize civic actions and determine
 * appropriate response times and resource allocation.
 *
 * @typedef {string} UrgencyLevel
 */
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Status values for civic actions
 *
 * These status values track the lifecycle of civic actions from
 * creation through completion or cancellation.
 *
 * @typedef {string} ActionStatus
 */
export type ActionStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

/**
 * Advanced civic action data structure
 *
 * Represents a sophisticated civic action with comprehensive tracking
 * capabilities including representative targeting, signature collection,
 * and community impact measurement.
 *
 * @interface SophisticatedCivicAction
 */
export type SophisticatedCivicAction = {
  /** Unique identifier for the civic action */
  id: string;
  /** Title of the civic action */
  title: string;
  /** Detailed description of the civic action */
  description: string;
  /** Type of civic action (petition, campaign, etc.) */
  action_type: CivicActionType;
  /** Category classification for the action */
  category: string;
  /** Urgency level for prioritization */
  urgency_level: UrgencyLevel;
  /** Array of representative IDs to target */
  target_representatives: number[];
  /** Current number of signatures collected */
  signature_count: number;
  /** Target number of signatures to collect */
  target_signatures: number;
  /** Current status of the civic action */
  status: ActionStatus;
  /** Whether the action is publicly visible */
  is_public: boolean;
  /** ID of the user who created the action */
  created_by: string;
  /** ISO timestamp when the action was created */
  created_at: string;
  /** ISO timestamp when the action was last updated */
  updated_at: string;
  /** Optional end date for the action */
  end_date?: string;
  /** Additional metadata for the action */
  metadata?: Record<string, unknown>;
}

/**
 * Representative data structure with sophisticated features
 *
 * Represents a representative with comprehensive contact information,
 * social media presence, and advanced engagement metrics.
 *
 * @interface RepresentativeData
 */
export type RepresentativeData = {
  /** Unique representative identifier */
  id: number;
  /** Representative's full name */
  name: string;
  /** Official title/position */
  title: string;
  /** Political party affiliation */
  party: string;
  /** State represented */
  state: string;
  /** District represented */
  district: string;
  /** Contact information */
  contact_info: {
    email?: string;
    phone?: string;
    address?: string;
  };
  /** Social media presence */
  social_media: {
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  /** Advanced representative features */
  trust_score: number;
  responsiveness_score: number;
  civic_engagement_score: number;
  last_contact_date?: string;
  contact_frequency: number;
}

type CivicActionRecord = CivicAction & {
  urgency_level?: UrgencyLevel | null;
  target_representatives?: number[] | null;
  current_signatures?: number | null;
  required_signatures?: number | null;
  metadata?: Record<string, unknown> | null;
  is_public?: boolean | null;
  end_date?: string | null;
};

/**
 * Civic engagement metrics for community impact analysis
 *
 * Tracks civic engagement activities including petitions, representative
 * interactions, and community impact measurements with trust tier assessment.
 *
 * @interface CivicEngagementMetrics
 */
export type CivicEngagementMetrics = {
  /** Total number of civic actions created */
  total_actions: number;
  /** Number of active petitions */
  active_petitions: number;
  /** Number of representative interactions */
  representative_interactions: number;
  /** Total signature count across all actions */
  signature_count: number;
  /** Overall civic engagement score */
  civic_score: number;
  /** Community impact score */
  community_impact: number;
  /** User trust tier based on civic engagement */
  trust_tier: TrustTier;
}

/**
 * Create sophisticated civic action with comprehensive tracking
 *
 * Creates a new civic action with advanced features including representative
 * targeting, signature collection, urgency levels, and community impact tracking.
 *
 * @param {Object} actionData - Civic action creation data
 * @param {string} actionData.title - Action title
 * @param {string} actionData.description - Detailed action description
 * @param {CivicActionType} actionData.actionType - Type of civic action
 * @param {string} actionData.category - Action category
 * @param {UrgencyLevel} actionData.urgencyLevel - Urgency level for prioritization
 * @param {number[]} actionData.targetRepresentatives - Array of target representative IDs
 * @param {number} actionData.targetSignatures - Target number of signatures
 * @param {string} [actionData.endDate] - Optional end date for the action
 * @param {boolean} actionData.isPublic - Whether the action is publicly visible
 * @param {string} userId - User ID of action creator
 * @returns {Promise<SophisticatedCivicAction | null>} Created civic action or null if failed
 *
 * @example
 * ```typescript
 * const action = await createSophisticatedCivicAction({
 *   title: 'Climate Action Petition',
 *   description: 'Urgent petition for climate action',
 *   actionType: 'petition',
 *   category: 'environment',
 *   urgencyLevel: 'high',
 *   targetRepresentatives: [1, 2, 3],
 *   targetSignatures: 1000,
 *   isPublic: true
 * }, 'user-456');
 * ```
 *
 * @since 2.0.0
 */
export async function createSophisticatedCivicAction(
  actionData: {
    title: string;
    description: string;
    actionType: CivicActionType;
    category: string;
    urgencyLevel: UrgencyLevel;
    targetRepresentatives: number[];
    targetSignatures: number;
    endDate?: string;
    isPublic: boolean;
  },
  userId: string
): Promise<SophisticatedCivicAction | null> {
  assertCivicEngagementEnabled('createSophisticatedCivicAction');
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Failed to get Supabase client for creating civic action');
      return null;
    }

    // Prepare insert data
    const insertData: Record<string, unknown> = {
      title: actionData.title,
      description: actionData.description,
      action_type: actionData.actionType,
      category: actionData.category,
      urgency_level: actionData.urgencyLevel,
      target_representatives: actionData.targetRepresentatives,
      current_signatures: 0,
      required_signatures: actionData.targetSignatures,
      status: 'active',
      is_public: actionData.isPublic,
      created_by: userId,
      metadata: {
        created_via: 'web_platform',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        ip_address: 'tracked_separately'
      }
    };

    if (actionData.endDate) {
      insertData.end_date = actionData.endDate;
    }

    // Insert into database
    const { data: civicAction, error } = await supabase
      .from('civic_actions')
      .insert(insertData as unknown as CivicAction)
      .select()
      .single();

    if (error) {
      logger.error('Error creating sophisticated civic action in database:', error);
      return null;
    }

    // Map database result to SophisticatedCivicAction type
    const actionRecord = civicAction as CivicActionRecord;

    const result: SophisticatedCivicAction = {
      id: civicAction.id,
      title: civicAction.title,
      description: civicAction.description ?? '',
      action_type: civicAction.action_type as CivicActionType,
      category: civicAction.category ?? '',
      urgency_level: (actionRecord.urgency_level as UrgencyLevel) ?? 'medium',
      target_representatives: actionRecord.target_representatives ?? [],
      signature_count: actionRecord.current_signatures ?? 0,
      target_signatures: actionRecord.required_signatures ?? 0,
      status: civicAction.status as ActionStatus,
      is_public: actionRecord.is_public ?? true,
      created_by: civicAction.created_by,
      created_at: civicAction.created_at ?? new Date().toISOString(),
      updated_at: civicAction.updated_at ?? new Date().toISOString(),
      metadata: (actionRecord.metadata as Record<string, unknown>) ?? {},
    };

    if (actionRecord.end_date) {
      result.end_date = actionRecord.end_date;
    }

    logger.info('Sophisticated civic action created', {
      actionId: result.id,
      title: result.title,
      actionType: result.action_type,
      urgencyLevel: result.urgency_level,
      userId
    });

    return result;
  } catch (error) {
    logger.error('Error creating sophisticated civic action:', error);
    return null;
  }
}

/**
 * Get representatives by location with sophisticated filtering
 */
export async function getRepresentativesByLocation(
  location: {
    state: string;
    district?: string;
    city?: string;
  },
  filters: {
    party?: string;
    minTrustScore?: number;
    maxContactFrequency?: number;
    includeInactive?: boolean;
    limit?: number;
  } = {}
): Promise<RepresentativeData[]> {
  assertCivicEngagementEnabled('getRepresentativesByLocation');
  try {
    // In a real implementation, this would query the representatives_core table
    // with sophisticated filtering based on trust scores, contact frequency, etc.

    logger.info('Fetching representatives by location', {
      location,
      filters,
    });

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Failed to get Supabase client for representatives lookup');
      return [];
    }

    // Build query for representatives_core table
    let query = supabase
      .from('representatives_core')
      .select('id, name, office, party, state, district');

    // Apply location filters
    if (location.state) {
      query = query.eq('state', location.state);
    }
    if (location.district) {
      query = query.eq('district', location.district);
    }

    // Apply party filter
    if (filters.party) {
      query = query.eq('party', filters.party);
    }

    const resultLimit = filters.limit ?? 50;
    const { data: representatives, error } = await query.limit(resultLimit);

    if (error) {
      logger.error('Error fetching representatives from database:', error);
      return [];
    }

    if (!representatives || representatives.length === 0) {
      logger.info('No representatives found for location', { location });
      return [];
    }

    // Map to RepresentativeData format
    // Note: Some fields like trust_score, responsiveness_score, etc. would need
    // to be calculated or fetched from other tables in a full implementation
    const result: RepresentativeData[] = representatives.map((rep: any) => {
      const contactInfo: RepresentativeData['contact_info'] = {};
      const socialMedia: RepresentativeData['social_media'] = {};

      return {
        id: rep.id,
        name: rep.name ?? 'Unknown',
        title: rep.office ?? 'Representative',
        party: rep.party ?? 'Unknown',
        state: rep.state ?? location.state,
        district: rep.district ?? location.district ?? 'At-Large',
        contact_info: contactInfo,
        social_media: socialMedia,
        trust_score: 50,
        responsiveness_score: 50,
        civic_engagement_score: 50,
        contact_frequency: 0,
      };
    });

    return result;
  } catch (error) {
    logger.error('Error fetching representatives:', error);
    return [];
  }
}

/**
 * Track civic engagement metrics
 */
export function calculateCivicEngagementMetrics(
  actions: SophisticatedCivicAction[],
  interactions: number,
  signatures: number
): CivicEngagementMetrics {
  assertCivicEngagementEnabled('calculateCivicEngagementMetrics');
  const totalActions = actions.length;
  const activePetitions = actions.filter(a =>
    a.action_type === 'petition' && a.status === 'active'
  ).length;

  const civicScore = calculateCivicScore(actions, interactions, signatures);
  const communityImpact = calculateCommunityImpact(actions, signatures);
  const trustTier = calculateTrustTier(civicScore);

  return {
    total_actions: totalActions,
    active_petitions: activePetitions,
    representative_interactions: interactions,
    signature_count: signatures,
    civic_score: civicScore,
    community_impact: communityImpact,
    trust_tier: trustTier
  };
}

/**
 * Track representative contact with sophisticated analytics
 */
export async function trackRepresentativeContact(
  representativeId: number,
  contactData: {
    method: 'email' | 'phone' | 'mail' | 'social_media';
    subject: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    relatedActionId?: string;
  },
  userId: string
): Promise<boolean> {
  assertCivicEngagementEnabled('trackRepresentativeContact');
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Failed to get Supabase client for tracking contact');
      return false;
    }

    // Verify representative exists
    const { data: representative, error: repError } = await supabase
      .from('representatives_core')
      .select('id')
      .eq('id', representativeId)
      .single();

    if (repError || !representative) {
      logger.warn('Representative not found for contact tracking', { representativeId });
      return false;
    }

    // Create contact_messages record
    const { error: messageError } = await supabase
      .from('contact_messages')
      .insert({
        user_id: userId,
        representative_id: representativeId,
        subject: contactData.subject,
        message: contactData.message,
        status: 'draft', // Will be updated when actually sent
        metadata: {
          method: contactData.method,
          priority: contactData.priority,
          related_action_id: contactData.relatedActionId,
        },
      });

    if (messageError) {
      logger.error('Error creating contact message record:', messageError);
      return false;
    }

    // Track analytics event
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'representative_contact',
        user_id: userId,
        event_data: {
          representative_id: representativeId,
          method: contactData.method,
          priority: contactData.priority,
          related_action_id: contactData.relatedActionId,
        },
      });
    } catch (analyticsError) {
      // Non-blocking: log but don't fail
      logger.warn('Failed to track analytics for representative contact', analyticsError);
    }

    logger.info('Representative contact tracked', {
      representativeId,
      method: contactData.method,
      priority: contactData.priority,
      userId,
      relatedActionId: contactData.relatedActionId
    });

    return true;
  } catch (error) {
    logger.error('Error tracking representative contact:', error);
    return false;
  }
}

/**
 * Get trending civic actions from database
 * Calculates trending based on signature growth rate, engagement score, urgency, and time decay
 */
export async function getTrendingCivicActions(
  limit: number = 10,
  category?: string,
  supabaseClient?: SupabaseClient
): Promise<SophisticatedCivicAction[]> {
  assertCivicEngagementEnabled('getTrendingCivicActions');
  try {
    logger.info('Fetching trending civic actions', { limit, category });

    const supabase = supabaseClient ?? await getSupabaseServerClient();

    if (!supabase) {
      logger.error('Failed to get Supabase client for trending civic actions');
      return [];
    }

    // Build query for public, active civic actions
    let query = supabase
      .from('civic_actions')
      .select(`
        id,
        title,
        description,
        action_type,
        category,
        created_by,
        created_at,
        updated_at,
        end_date,
        status,
        current_signatures,
        required_signatures,
        target_representative_id,
        target_state,
        target_district,
        target_office
      `);

    if (category) {
      query = query.eq('category', category);
    }

    query = query
      .eq('status', 'active')
      .order('current_signatures', { ascending: false })
      .order('created_at', { ascending: false });

    const { data: actions, error } = await query.limit(limit);

    if (error) {
      logger.error('Error fetching trending civic actions from database', error);
      return [];
    }

    if (!actions?.length) {
      logger.info('No trending civic actions found', { limit, category });
      return [];
    }

    // Calculate trending score and sort by trending algorithm
    // Trending factors: signature growth rate, recency
    const now = Date.now();
    const trendingActions = actions.map((action: any) => {
      const createdAt = new Date(action.created_at || Date.now()).getTime();
      const ageInHours = (now - createdAt) / (1000 * 60 * 60);
      const signatureCount = action.current_signatures ?? 0;
      const signatureGrowthRate = signatureCount / Math.max(ageInHours, 1);

      // Time decay factor (more recent = higher score)
      const timeDecay = Math.max(0, 1 - (ageInHours / (7 * 24))); // Decay over 7 days

      // Calculate trending score
      const trendingScore = signatureGrowthRate * timeDecay;

      return {
        ...action,
        // Map schema fields to expected format
        signature_count: action.current_signatures ?? 0,
        target_signatures: action.required_signatures ?? 1000,
        target_representatives: action.target_representative_id ? [action.target_representative_id] : [],
        urgency_level: 'medium' as any, // Default urgency
        is_public: true,
        metadata: {},
        trendingScore
      };
    }).sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0))
      .slice(0, limit)
      .map(({ trendingScore: _trendingScore, ...action }) => action);

    logger.info('Retrieved trending civic actions', { count: trendingActions.length, limit, category });

    return trendingActions;
  } catch (error) {
    logger.error('Error fetching trending civic actions', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Calculate civic engagement score
 */
export function calculateCivicScore(
  actions: SophisticatedCivicAction[],
  interactions: number,
  signatures: number
): number {
  assertCivicEngagementEnabled('calculateCivicScore');
  const actionScore = actions.length * 10;
  const interactionScore = interactions * 5;
  const signatureScore = Math.min(signatures / 100, 50); // Cap at 50 points

  return Math.min(actionScore + interactionScore + signatureScore, 100);
}

/**
 * Calculate community impact score
 */
export function calculateCommunityImpact(
  actions: SophisticatedCivicAction[],
  signatures: number
): number {
  assertCivicEngagementEnabled('calculateCommunityImpact');
  const publicActions = actions.filter(a => a.is_public).length;
  const signatureImpact = Math.min(signatures / 1000, 50); // Cap at 50 points

  return Math.min(publicActions * 10 + signatureImpact, 100);
}

/**
 * Calculate trust tier based on civic score
 */
export function calculateTrustTier(civicScore: number): TrustTier {
  assertCivicEngagementEnabled('calculateTrustTier');
  if (civicScore >= 90) return 'T3';
  if (civicScore >= 75) return 'T2';
  if (civicScore >= 50) return 'T1';
  return 'T0';
}

/**
 * Get civic engagement recommendations
 */
export function getCivicEngagementRecommendations(
  userMetrics: CivicEngagementMetrics,
  _availableActions: SophisticatedCivicAction[]
): string[] {
  assertCivicEngagementEnabled('getCivicEngagementRecommendations');
  const recommendations: string[] = [];

  if (userMetrics.total_actions < 3) {
    recommendations.push("Create your first civic action to get started");
  }

  if (userMetrics.representative_interactions < 2) {
    recommendations.push("Contact your representatives to make your voice heard");
  }

  if (userMetrics.signature_count < 10) {
    recommendations.push("Sign petitions to support causes you care about");
  }

  if (userMetrics.civic_score < 50) {
    recommendations.push("Increase your civic engagement to build trust in your community");
  }

  if (userMetrics.trust_tier === 'T0' || userMetrics.trust_tier === 'T1') {
    recommendations.push("Complete more civic actions to increase your trust tier");
  }

  return recommendations;
}
