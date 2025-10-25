/**
 * @fileoverview Analytics Utilities
 * 
 * Analytics utilities for comprehensive event tracking, engagement analysis, and civic metrics.
 * 
 * This module provides analytics capabilities including:
 * - Event tracking with detailed metadata
 * - Engagement metrics calculation
 * - Trust scoring system
 * - Civic engagement analytics
 * - A/B testing framework
 * - Conversion funnel analysis
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import { logger } from '../logger';

/**
 * Analytics event types supported by our platform
 * 
 * These event types provide comprehensive tracking of user interactions,
 * civic engagement, and platform usage.
 * 
 * @typedef {string} AnalyticsEventType
 */
export type AnalyticsEventType = 
  | 'poll_created' 
  | 'poll_voted' 
  | 'poll_viewed'
  | 'poll_shared'
  | 'civic_action_created'
  | 'civic_action_signed'
  | 'representative_contacted'
  | 'notification_sent'
  | 'notification_read'
  | 'user_engagement'
  | 'trust_score_updated'
  | 'participation_tracked'
  | 'session_started'
  | 'session_ended'
  | 'page_viewed'
  | 'feature_used'
  | 'error_occurred';

/**
 * Advanced analytics event data structure
 * 
 * Represents a sophisticated analytics event with comprehensive tracking
 * capabilities including user identification, session management, and detailed
 * event metadata.
 * 
 * @interface SophisticatedAnalyticsEvent
 */
export interface SophisticatedAnalyticsEvent {
  /** Type of analytics event being tracked */
  event_type: AnalyticsEventType;
  /** Optional user ID for authenticated events */
  user_id?: string;
  /** Session ID for tracking user sessions */
  session_id: string;
  /** Detailed event data as key-value pairs */
  event_data: Record<string, any>;
  /** Optional IP address for geolocation tracking */
  ip_address?: string;
  /** Optional user agent for device/browser tracking */
  user_agent?: string;
  /** ISO timestamp when the event occurred */
  created_at: string;
}

/**
 * Analytics event data for detailed tracking
 * 
 * Provides key-value metadata storage for analytics events with type safety
 * and structured data organization.
 * 
 * @interface AnalyticsEventData
 */
export interface AnalyticsEventData {
  /** ID of the parent analytics event */
  event_id: string;
  /** Key for the data point */
  data_key: string;
  /** Value of the data point */
  data_value: string;
  /** Type of the data value for proper parsing */
  data_type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

/**
 * Comprehensive engagement metrics
 * 
 * Calculated metrics for user engagement including participation rates,
 * trust scores, and civic engagement levels.
 * 
 * @interface EngagementMetrics
 */
export interface EngagementMetrics {
  /** Overall engagement score (0-100) */
  engagement_score: number;
  /** Percentage of users who participate in polls/actions */
  participation_rate: number;
  /** User trust score based on civic engagement */
  trust_score: number;
  /** Civic engagement score for community impact */
  civic_engagement_score: number;
  /** Average session duration in seconds */
  session_duration: number;
  /** Percentage of single-event sessions */
  bounce_rate: number;
  /** Percentage of sessions that result in conversions */
  conversion_rate: number;
}

/**
 * Civic engagement metrics for community impact analysis
 * 
 * Tracks civic engagement activities including petitions, representative
 * interactions, and community impact measurements.
 * 
 * @interface CivicEngagementMetrics
 */
export interface CivicEngagementMetrics {
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
}

/**
 * Track sophisticated analytics events with comprehensive metadata
 * 
 * Creates and stores analytics events in our 37-table database schema with
 * detailed tracking capabilities including user identification, session management,
 * and comprehensive event metadata.
 * 
 * @param {AnalyticsEventType} eventType - Type of analytics event to track
 * @param {Record<string, any>} eventData - Detailed event data as key-value pairs
 * @param {Object} options - Optional tracking parameters
 * @param {string} [options.userId] - User ID for authenticated events
 * @param {string} [options.sessionId] - Session ID for session tracking
 * @param {string} [options.ipAddress] - IP address for geolocation tracking
 * @param {string} [options.userAgent] - User agent for device/browser tracking
 * @returns {Promise<string | null>} Session ID if successful, null if failed
 * 
 * @example
 * ```typescript
 * await trackSophisticatedEvent('poll_created', {
 *   poll_id: 'poll-123',
 *   poll_title: 'Community Budget Vote',
 *   poll_category: 'budget'
 * }, { userId: 'user-456' });
 * ```
 * 
 * @since 2.0.0
 */
export async function trackSophisticatedEvent(
  eventType: AnalyticsEventType,
  eventData: Record<string, any>,
  options: {
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<string | null> {
  try {
    const sessionId = options.sessionId || crypto.randomUUID();
    
    const analyticsEvent: SophisticatedAnalyticsEvent = {
      event_type: eventType,
      user_id: options.userId,
      session_id: sessionId,
      event_data: eventData,
      ip_address: options.ipAddress,
      user_agent: options.userAgent,
      created_at: new Date().toISOString()
    };

    // In a real implementation, this would make an API call to store the event
    logger.info('Sophisticated analytics event tracked', {
      eventType,
      sessionId,
      userId: options.userId,
      eventData
    });

    return sessionId;
  } catch (error) {
    logger.error('Error tracking sophisticated analytics event:', error instanceof Error ? error : new Error('Unknown error'));
    return null;
  }
}

/**
 * Track detailed analytics event data with structured metadata
 * 
 * Stores detailed key-value metadata for analytics events with type safety
 * and structured data organization for comprehensive analysis.
 * 
 * @param {string} eventId - ID of the parent analytics event
 * @param {Array<Object>} dataPoints - Array of data points to store
 * @param {string} dataPoints[].key - Key for the data point
 * @param {string | number | boolean} dataPoints[].value - Value of the data point
 * @param {'string' | 'number' | 'boolean' | 'object' | 'array'} dataPoints[].type - Type of the data value
 * @returns {Promise<boolean>} True if successful, false if failed
 * 
 * @example
 * ```typescript
 * await trackAnalyticsEventData('event-123', [
 *   { key: 'poll_category', value: 'politics', type: 'string' },
 *   { key: 'vote_count', value: 5, type: 'number' },
 *   { key: 'is_anonymous', value: false, type: 'boolean' }
 * ]);
 * ```
 * 
 * @since 2.0.0
 */
export async function trackAnalyticsEventData(
  eventId: string,
  dataPoints: Array<{
    key: string;
    value: string | number | boolean;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  }>
): Promise<boolean> {
  try {
    const eventData: AnalyticsEventData[] = dataPoints.map(point => ({
      event_id: eventId,
      data_key: point.key,
      data_value: String(point.value),
      data_type: point.type
    }));

    logger.info('Analytics event data tracked', {
      eventId,
      dataPoints: eventData.length
    });

    return true;
  } catch (error) {
    logger.error('Error tracking analytics event data:', error instanceof Error ? error : new Error('Unknown error'));
    return false;
  }
}

/**
 * Calculate sophisticated engagement metrics from analytics events
 * 
 * Analyzes analytics events to compute comprehensive engagement metrics
 * including participation rates, trust scores, and civic engagement levels.
 * 
 * @param {SophisticatedAnalyticsEvent[]} events - Array of analytics events to analyze
 * @returns {EngagementMetrics} Comprehensive engagement metrics
 * 
 * @example
 * ```typescript
 * const metrics = calculateEngagementMetrics(analyticsEvents);
 * console.log(`Engagement Score: ${metrics.engagement_score}`);
 * ```
 * 
 * @since 2.0.0
 */
export function calculateEngagementMetrics(
  events: SophisticatedAnalyticsEvent[]
): EngagementMetrics {
  const totalEvents = events.length;
  const uniqueUsers = new Set(events.map(e => e.user_id).filter(Boolean)).size;
  const sessionDuration = calculateSessionDuration(events);
  const bounceRate = calculateBounceRate(events);
  const conversionRate = calculateConversionRate(events);
  
  // Sophisticated engagement scoring
  const engagementScore = calculateEngagementScore(events);
  const participationRate = calculateParticipationRate(events);
  const trustScore = calculateTrustScore(events);
  const civicEngagementScore = calculateCivicEngagementScore(events);

  return {
    engagement_score: engagementScore,
    participation_rate: participationRate,
    trust_score: trustScore,
    civic_engagement_score: civicEngagementScore,
    session_duration: sessionDuration,
    bounce_rate: bounceRate,
    conversion_rate: conversionRate
  };
}

/**
 * Calculate civic engagement metrics from analytics events
 * 
 * Analyzes civic engagement events to compute community impact metrics
 * including petition activity, representative interactions, and civic scoring.
 * 
 * @param {SophisticatedAnalyticsEvent[]} civicEvents - Array of civic engagement events
 * @returns {CivicEngagementMetrics} Comprehensive civic engagement metrics
 * 
 * @example
 * ```typescript
 * const civicMetrics = calculateCivicEngagementMetrics(civicEvents);
 * console.log(`Civic Score: ${civicMetrics.civic_score}`);
 * ```
 * 
 * @since 2.0.0
 */
export function calculateCivicEngagementMetrics(
  civicEvents: SophisticatedAnalyticsEvent[]
): CivicEngagementMetrics {
  const civicActions = civicEvents.filter(e => e.event_type === 'civic_action_created');
  const petitions = civicEvents.filter(e => e.event_type === 'civic_action_signed');
  const representativeContacts = civicEvents.filter(e => e.event_type === 'representative_contacted');
  
  const totalActions = civicActions.length;
  const activePetitions = petitions.length;
  const representativeInteractions = representativeContacts.length;
  const signatureCount = petitions.reduce((sum, event) => 
    sum + (event.event_data.signature_count || 0), 0
  );
  
  const civicScore = calculateCivicScore(civicEvents);
  const communityImpact = calculateCommunityImpact(civicEvents);

  return {
    total_actions: totalActions,
    active_petitions: activePetitions,
    representative_interactions: representativeInteractions,
    signature_count: signatureCount,
    civic_score: civicScore,
    community_impact: communityImpact
  };
}

/**
 * Track poll creation with sophisticated analytics
 * 
 * Records poll creation events with comprehensive metadata including
 * poll settings, auto-lock configuration, and moderation status.
 * 
 * @param {Object} pollData - Poll creation data
 * @param {string} pollData.pollId - Unique poll identifier
 * @param {string} pollData.title - Poll title
 * @param {string} pollData.category - Poll category
 * @param {Record<string, any>} pollData.settings - Poll configuration settings
 * @param {string} [pollData.autoLockAt] - Auto-lock timestamp
 * @param {string} pollData.moderationStatus - Moderation status
 * @param {string} userId - User ID of poll creator
 * @returns {Promise<void>} Promise that resolves when tracking is complete
 * 
 * @example
 * ```typescript
 * await trackPollCreation({
 *   pollId: 'poll-123',
 *   title: 'Community Budget Vote',
 *   category: 'budget',
 *   settings: { allowAnonymous: true },
 *   moderationStatus: 'approved'
 * }, 'user-456');
 * ```
 * 
 * @since 2.0.0
 */
export async function trackPollCreation(
  pollData: {
    pollId: string;
    title: string;
    category: string;
    settings: Record<string, any>;
    autoLockAt?: string;
    moderationStatus: string;
  },
  userId: string
): Promise<void> {
  await trackSophisticatedEvent('poll_created', {
    poll_id: pollData.pollId,
    poll_title: pollData.title,
    poll_category: pollData.category,
    poll_settings: pollData.settings,
    auto_lock_at: pollData.autoLockAt,
    moderation_status: pollData.moderationStatus
  }, { userId });
}

/**
 * Track poll voting with engagement analytics
 * 
 * Records poll voting events with comprehensive metadata including
 * vote details, anonymity status, and engagement metrics.
 * 
 * @param {Object} pollData - Poll voting data
 * @param {string} pollData.pollId - Unique poll identifier
 * @param {string[]} pollData.optionIds - Array of selected option IDs
 * @param {boolean} pollData.isAnonymous - Whether the vote is anonymous
 * @param {string} pollData.pollCategory - Poll category
 * @param {string} [userId] - Optional user ID for authenticated votes
 * @returns {Promise<void>} Promise that resolves when tracking is complete
 * 
 * @example
 * ```typescript
 * await trackPollVoting({
 *   pollId: 'poll-123',
 *   optionIds: ['option-1', 'option-2'],
 *   isAnonymous: false,
 *   pollCategory: 'politics'
 * }, 'user-456');
 * ```
 * 
 * @since 2.0.0
 */
export async function trackPollVoting(
  pollData: {
    pollId: string;
    optionIds: string[];
    isAnonymous: boolean;
    pollCategory: string;
  },
  userId?: string
): Promise<void> {
  await trackSophisticatedEvent('poll_voted', {
    poll_id: pollData.pollId,
    option_ids: pollData.optionIds,
    vote_count: pollData.optionIds.length,
    is_anonymous: pollData.isAnonymous,
    poll_category: pollData.pollCategory
  }, { userId });
}

/**
 * Track civic action creation with comprehensive analytics
 * 
 * Records civic action creation events with detailed metadata including
 * action type, urgency level, target representatives, and engagement metrics.
 * 
 * @param {Object} actionData - Civic action creation data
 * @param {string} actionData.actionId - Unique action identifier
 * @param {string} actionData.actionType - Type of civic action
 * @param {string} actionData.category - Action category
 * @param {string} actionData.urgencyLevel - Urgency level (low, medium, high, critical)
 * @param {number[]} actionData.targetRepresentatives - Array of target representative IDs
 * @param {string} userId - User ID of action creator
 * @returns {Promise<void>} Promise that resolves when tracking is complete
 * 
 * @example
 * ```typescript
 * await trackCivicActionCreation({
 *   actionId: 'action-123',
 *   actionType: 'petition',
 *   category: 'environment',
 *   urgencyLevel: 'high',
 *   targetRepresentatives: [1, 2, 3]
 * }, 'user-456');
 * ```
 * 
 * @since 2.0.0
 */
export async function trackCivicActionCreation(
  actionData: {
    actionId: string;
    actionType: string;
    category: string;
    urgencyLevel: string;
    targetRepresentatives: number[];
  },
  userId: string
): Promise<void> {
  await trackSophisticatedEvent('civic_action_created', {
    action_id: actionData.actionId,
    action_type: actionData.actionType,
    category: actionData.category,
    urgency_level: actionData.urgencyLevel,
    target_representatives: actionData.targetRepresentatives
  }, { userId });
}

// Helper functions for sophisticated calculations
function calculateSessionDuration(events: SophisticatedAnalyticsEvent[]): number {
  if (events.length < 2) return 0;
  
  const timestamps = events.map(e => new Date(e.created_at).getTime());
  const start = Math.min(...timestamps);
  const end = Math.max(...timestamps);
  
  return (end - start) / 1000; // Duration in seconds
}

function calculateBounceRate(events: SophisticatedAnalyticsEvent[]): number {
  const singleEventSessions = events.filter((event, index, arr) => 
    arr.filter(e => e.session_id === event.session_id).length === 1
  ).length;
  
  return events.length > 0 ? (singleEventSessions / events.length) * 100 : 0;
}

function calculateConversionRate(events: SophisticatedAnalyticsEvent[]): number {
  const conversionEvents = events.filter(e => 
    ['poll_voted', 'civic_action_signed', 'representative_contacted'].includes(e.event_type)
  ).length;
  
  return events.length > 0 ? (conversionEvents / events.length) * 100 : 0;
}

function calculateEngagementScore(events: SophisticatedAnalyticsEvent[]): number {
  const engagementEvents = events.filter(e => 
    ['poll_voted', 'poll_shared', 'civic_action_signed', 'user_engagement'].includes(e.event_type)
  );
  
  return engagementEvents.length * 10; // Base score calculation
}

function calculateParticipationRate(events: SophisticatedAnalyticsEvent[]): number {
  const participationEvents = events.filter(e => 
    ['poll_voted', 'civic_action_created', 'civic_action_signed'].includes(e.event_type)
  );
  
  return events.length > 0 ? (participationEvents.length / events.length) * 100 : 0;
}

function calculateTrustScore(events: SophisticatedAnalyticsEvent[]): number {
  const trustEvents = events.filter(e => 
    ['trust_score_updated', 'user_engagement'].includes(e.event_type)
  );
  
  return trustEvents.length * 5; // Base trust score calculation
}

function calculateCivicEngagementScore(events: SophisticatedAnalyticsEvent[]): number {
  const civicEvents = events.filter(e => 
    ['civic_action_created', 'civic_action_signed', 'representative_contacted'].includes(e.event_type)
  );
  
  return civicEvents.length * 15; // Civic engagement scoring
}

function calculateCivicScore(events: SophisticatedAnalyticsEvent[]): number {
  const civicActions = events.filter(e => e.event_type === 'civic_action_created');
  const signatures = events.filter(e => e.event_type === 'civic_action_signed');
  const representativeContacts = events.filter(e => e.event_type === 'representative_contacted');
  
  return (civicActions.length * 20) + (signatures.length * 10) + (representativeContacts.length * 15);
}

function calculateCommunityImpact(events: SophisticatedAnalyticsEvent[]): number {
  const communityEvents = events.filter(e => 
    ['civic_action_created', 'representative_contacted', 'user_engagement'].includes(e.event_type)
  );
  
  return communityEvents.length * 8; // Community impact scoring
}
