/**
 * @fileoverview Civic Engagement Utilities
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

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { logger } from '../logger';

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
  trust_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
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
  try {
    const civicAction: SophisticatedCivicAction = {
      id: crypto.randomUUID(),
      title: actionData.title,
      description: actionData.description,
      action_type: actionData.actionType,
      category: actionData.category,
      urgency_level: actionData.urgencyLevel,
      target_representatives: actionData.targetRepresentatives,
      signature_count: 0,
      target_signatures: actionData.targetSignatures,
      status: 'active',
      is_public: actionData.isPublic,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      end_date: actionData.endDate,
      metadata: {
        created_via: 'web_platform',
        user_agent: navigator.userAgent,
        ip_address: 'tracked_separately'
      }
    };

    logger.info('Sophisticated civic action created', {
      actionId: civicAction.id,
      title: civicAction.title,
      actionType: civicAction.action_type,
      urgencyLevel: civicAction.urgency_level,
      userId
    });

    return civicAction;
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
  } = {}
): Promise<RepresentativeData[]> {
  try {
    // In a real implementation, this would query the representatives_core table
    // with sophisticated filtering based on trust scores, contact frequency, etc.
    
    logger.info('Fetching representatives by location', {
      location,
      filters
    });

    // Mock data for demonstration
    const representatives: RepresentativeData[] = [
      {
        id: 1,
        name: "Senator Jane Smith",
        title: "U.S. Senator",
        party: "Democratic",
        state: location.state,
        district: location.district ?? "At-Large",
        contact_info: {
          email: "jane.smith@senate.gov",
          phone: "(202) 224-1234"
        },
        social_media: {
          twitter: "@SenJaneSmith",
          website: "https://janesmith.senate.gov"
        },
        trust_score: 85,
        responsiveness_score: 78,
        civic_engagement_score: 92,
        contact_frequency: 2
      }
    ];

    return representatives;
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
  try {
    // Track the contact in analytics
    logger.info('Representative contact tracked', {
      representativeId,
      method: contactData.method,
      priority: contactData.priority,
      userId,
      relatedActionId: contactData.relatedActionId
    });

    // In a real implementation, this would:
    // 1. Create a contact_messages record
    // 2. Update representative contact frequency
    // 3. Track analytics events
    // 4. Send notifications if needed

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
        urgency_level,
        target_representatives,
        signature_count,
        target_signatures,
        status,
        is_public,
        created_by,
        created_at,
        updated_at,
        end_date
      `)
      .eq('is_public', true)
      .eq('status', 'active')
      .order('signature_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category);
    }

    const { data: actions, error } = await query;

    if (error) {
      logger.error('Error fetching trending civic actions from database', error);
      return [];
    }

    if (!actions?.length) {
      logger.info('No trending civic actions found', { limit, category });
      return [];
    }

    // Calculate trending score and sort by trending algorithm
    // Trending factors: signature growth rate, urgency level, recency
    const now = Date.now();
    const trendingActions = actions.map((action: SophisticatedCivicAction & { trendingScore?: number }) => {
      const createdAt = new Date(action.created_at).getTime();
      const ageInHours = (now - createdAt) / (1000 * 60 * 60);
      const signatureGrowthRate = action.signature_count / Math.max(ageInHours, 1);
      
      // Urgency multiplier
      const urgencyMultiplier: Record<string, number> = {
        'critical': 2.0,
        'high': 1.5,
        'medium': 1.0,
        'low': 0.7
      };
      
      // Time decay factor (more recent = higher score)
      const timeDecay = Math.max(0, 1 - (ageInHours / (7 * 24))); // Decay over 7 days
      
      // Calculate trending score
      const trendingScore = signatureGrowthRate * (urgencyMultiplier[action.urgency_level] ?? 1.0) * timeDecay;
      
      return {
        ...action,
        trendingScore
      };
    }).sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0))
      .slice(0, limit)
      .map(({ trendingScore: _trendingScore, ...action }) => action as SophisticatedCivicAction);

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
  const publicActions = actions.filter(a => a.is_public).length;
  const signatureImpact = Math.min(signatures / 1000, 50); // Cap at 50 points
  
  return Math.min(publicActions * 10 + signatureImpact, 100);
}

/**
 * Calculate trust tier based on civic score
 */
export function calculateTrustTier(civicScore: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (civicScore >= 90) return 'platinum';
  if (civicScore >= 75) return 'gold';
  if (civicScore >= 50) return 'silver';
  return 'bronze';
}

/**
 * Get civic engagement recommendations
 */
export function getCivicEngagementRecommendations(
  userMetrics: CivicEngagementMetrics,
  _availableActions: SophisticatedCivicAction[]
): string[] {
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

  if (userMetrics.trust_tier === 'bronze') {
    recommendations.push("Complete more civic actions to increase your trust tier");
  }

  return recommendations;
}
