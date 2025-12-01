/**
 * Civic Actions Analytics Events
 *
 * Analytics tracking for Civic Engagement V2 features
 *
 * Feature Flag: CIVIC_ENGAGEMENT_V2
 */

import type { AnalyticsActions, AnalyticsEvent } from '@/lib/stores/analyticsStore';

export type CivicActionEventName =
  | 'civic_action_created'
  | 'civic_action_viewed'
  | 'civic_action_signed'
  | 'civic_action_updated'
  | 'civic_action_deleted'
  | 'civic_action_shared'
  | 'civic_action_list_viewed'
  | 'civic_action_filter_applied'
  | 'civic_action_create_form_started'
  | 'civic_action_create_form_submitted'
  | 'civic_action_create_form_cancelled'
  | 'civic_action_representative_targeted'
  | 'civic_action_trending_viewed';

export type CivicActionEventBase = {
  actionId: string | null;
  actionType: 'petition' | 'campaign' | 'survey' | 'event' | 'protest' | 'meeting' | null;
  category: string | null;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical' | null;
  targetRepresentatives: number[] | null;
  targetState: string | null;
  targetDistrict: string | null;
  source?: string;
} & Record<string, unknown>;

export type CivicActionEventMap = {
  civic_action_created: CivicActionEventBase & {
    title: string;
    isPublic: boolean;
    requiredSignatures: number | null;
    hasEndDate: boolean;
  };
  civic_action_viewed: CivicActionEventBase & {
    signatureCount: number;
    requiredSignatures: number | null;
    progressPercentage: number;
  };
  civic_action_signed: CivicActionEventBase & {
    signatureCount: number;
    requiredSignatures: number | null;
    progressPercentage: number;
    milestoneReached?: boolean;
  };
  civic_action_updated: CivicActionEventBase & {
    updatedFields: string[];
  };
  civic_action_deleted: CivicActionEventBase & {
    reason?: string;
  };
  civic_action_shared: CivicActionEventBase & {
    shareMethod: 'link' | 'social' | 'email';
    platform?: string;
  };
  civic_action_list_viewed: {
    filterStatus?: string;
    filterActionType?: string;
    filterCategory?: string;
    filterUrgency?: string;
    totalActions: number;
    source?: string;
  };
  civic_action_filter_applied: {
    filterType: 'status' | 'action_type' | 'category' | 'urgency_level' | 'is_public';
    filterValue: string;
    totalResults: number;
  };
  civic_action_create_form_started: {
    source?: string;
  };
  civic_action_create_form_submitted: CivicActionEventBase & {
    title: string;
    hasDescription: boolean;
    isPublic: boolean;
    requiredSignatures: number | null;
    hasEndDate: boolean;
    formCompletionTime?: number;
  };
  civic_action_create_form_cancelled: {
    hadContent: boolean;
    fieldsFilled: string[];
  };
  civic_action_representative_targeted: CivicActionEventBase & {
    representativeId: number;
    representativeName: string | null;
  };
  civic_action_trending_viewed: {
    category?: string;
    limit: number;
    totalTrending: number;
  };
};

const CIVIC_ACTION_ACTION_MAP: Record<CivicActionEventName, string> = {
  civic_action_created: 'created',
  civic_action_viewed: 'viewed',
  civic_action_signed: 'signed',
  civic_action_updated: 'updated',
  civic_action_deleted: 'deleted',
  civic_action_shared: 'shared',
  civic_action_list_viewed: 'list_viewed',
  civic_action_filter_applied: 'filter_applied',
  civic_action_create_form_started: 'create_form_started',
  civic_action_create_form_submitted: 'create_form_submitted',
  civic_action_create_form_cancelled: 'create_form_cancelled',
  civic_action_representative_targeted: 'representative_targeted',
  civic_action_trending_viewed: 'trending_viewed',
};

export type CivicActionEventRecord<
  E extends CivicActionEventName = CivicActionEventName,
> = {
  type: E;
  data: CivicActionEventMap[E];
  value?: number;
  metadata?: Record<string, unknown>;
  label?: string;
};

export function trackCivicActionEvent<
  E extends CivicActionEventName = CivicActionEventName,
>(
  trackEvent: AnalyticsActions['trackEvent'] | undefined,
  event: CivicActionEventRecord<E>,
) {
  if (!trackEvent) {
    return;
  }

  const label = event.label ?? (event.data as CivicActionEventBase).actionId ?? undefined;

  const analyticsEvent: Omit<AnalyticsEvent, 'id' | 'sessionId' | 'timestamp'> = {
    event_type: event.type,
    type: 'civics',
    category: 'civic_engagement_v2',
    action: CIVIC_ACTION_ACTION_MAP[event.type],
    value: event.value ?? 1,
    created_at: new Date().toISOString(),
    event_data: event.data,
    session_id: '',
  };

  if (label !== undefined) {
    analyticsEvent.label = label;
  }

  if (event.metadata !== undefined) {
    analyticsEvent.metadata = event.metadata;
  }

  trackEvent(analyticsEvent);
}

