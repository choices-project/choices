import type { AnalyticsActions, AnalyticsEvent } from '@/lib/stores/analyticsStore';

export type CivicsRepresentativeEventName =
  | 'civics_representative_follow_toggle'
  | 'civics_representative_contact_click'
  | 'civics_representative_view_details'
  | 'civics_representative_contact_modal_open'
  | 'civics_representative_contact_modal_close'
  | 'civics_representative_contact_send'
  | 'civics_representative_contact_send_error'
  | 'civics_representative_contact_template_select'
  | 'civics_representative_contact_template_clear'
  | 'civics_representative_contact_launch'
  | 'civics_representative_bulk_contact_modal_open'
  | 'civics_representative_bulk_contact_modal_close'
  | 'civics_representative_bulk_contact_send'
  | 'civics_representative_bulk_contact_send_error'
  | 'civics_representative_bulk_contact_template_select'
  | 'civics_representative_bulk_contact_template_clear';

export type CivicsRepresentativeSingleEventName = Exclude<
  CivicsRepresentativeEventName,
  | 'civics_representative_bulk_contact_modal_open'
  | 'civics_representative_bulk_contact_modal_close'
  | 'civics_representative_bulk_contact_send'
  | 'civics_representative_bulk_contact_send_error'
  | 'civics_representative_bulk_contact_template_select'
  | 'civics_representative_bulk_contact_template_clear'
>;

export interface CivicsRepresentativeEventBase extends Record<string, unknown> {
  representativeId: number | null;
  representativeName: string | null;
  divisionIds: string[];
  nextElectionId: string | null;
  nextElectionDay: string | null;
  electionCountdownDays: number | null;
  source?: string;
}

export interface CivicsRepresentativeBulkEventBase extends Record<string, unknown> {
  representativeIds: number[];
  selectedRepresentativeIds?: number[];
  totalRepresentatives: number;
  selectedCount: number;
  divisionIds: string[];
}

export interface CivicsRepresentativeEventMap {
  civics_representative_follow_toggle: CivicsRepresentativeEventBase & {
    action: 'follow' | 'unfollow';
    previousFollowState: 'following' | 'not_following';
  };
  civics_representative_contact_click: CivicsRepresentativeEventBase & {
    ctaLocation?: string;
  };
  civics_representative_view_details: CivicsRepresentativeEventBase & {
    ctaLocation?: string;
  };
  civics_representative_contact_modal_open: CivicsRepresentativeEventBase;
  civics_representative_contact_modal_close: CivicsRepresentativeEventBase & {
    hadDraftContent: boolean;
    wasSuccessful: boolean;
  };
  civics_representative_contact_send: CivicsRepresentativeEventBase & {
    threadId: string | null;
    usedTemplateId: string | null;
    characterCount: number;
  };
  civics_representative_contact_send_error: CivicsRepresentativeEventBase & {
    errorMessage: string;
    usedTemplateId: string | null;
  };
  civics_representative_contact_template_select: CivicsRepresentativeEventBase & {
    templateId: string;
    templateTitle: string;
  };
  civics_representative_contact_template_clear: CivicsRepresentativeEventBase & {
    lastTemplateId: string;
  };
  civics_representative_contact_launch: CivicsRepresentativeEventBase;
  civics_representative_bulk_contact_modal_open: CivicsRepresentativeBulkEventBase;
  civics_representative_bulk_contact_modal_close: CivicsRepresentativeBulkEventBase & {
    hadDraftContent: boolean;
    wasSuccessful: boolean;
  };
  civics_representative_bulk_contact_send: CivicsRepresentativeBulkEventBase & {
    successCount: number;
    failureCount: number;
    templateId: string | null;
  };
  civics_representative_bulk_contact_send_error: CivicsRepresentativeBulkEventBase & {
    errorMessage: string;
    templateId: string | null;
  };
  civics_representative_bulk_contact_template_select: CivicsRepresentativeBulkEventBase & {
    templateId: string;
    templateTitle: string;
  };
  civics_representative_bulk_contact_template_clear: CivicsRepresentativeBulkEventBase & {
    lastTemplateId: string;
  };
}

const CIVICS_REPRESENTATIVE_ACTION_MAP: Record<CivicsRepresentativeEventName, string> = {
  civics_representative_follow_toggle: 'follow_toggle',
  civics_representative_contact_click: 'contact_click',
  civics_representative_view_details: 'view_details',
  civics_representative_contact_modal_open: 'contact_modal_open',
  civics_representative_contact_modal_close: 'contact_modal_close',
  civics_representative_contact_send: 'contact_send',
  civics_representative_contact_send_error: 'contact_send_error',
  civics_representative_contact_template_select: 'contact_template_select',
  civics_representative_contact_template_clear: 'contact_template_clear',
  civics_representative_contact_launch: 'contact_launch',
  civics_representative_bulk_contact_modal_open: 'bulk_contact_modal_open',
  civics_representative_bulk_contact_modal_close: 'bulk_contact_modal_close',
  civics_representative_bulk_contact_send: 'bulk_contact_send',
  civics_representative_bulk_contact_send_error: 'bulk_contact_send_error',
  civics_representative_bulk_contact_template_select: 'bulk_contact_template_select',
  civics_representative_bulk_contact_template_clear: 'bulk_contact_template_clear',
};

export type CivicsRepresentativeEventRecord<
  E extends CivicsRepresentativeEventName = CivicsRepresentativeEventName,
> = {
  type: E;
  data: CivicsRepresentativeEventMap[E];
  value?: number;
  metadata?: Record<string, unknown>;
  label?: string;
};

export const CIVICS_REPRESENTATIVE_SINGLE_EVENT_SET: ReadonlySet<CivicsRepresentativeSingleEventName> =
  new Set([
    'civics_representative_follow_toggle',
    'civics_representative_contact_click',
    'civics_representative_view_details',
    'civics_representative_contact_modal_open',
    'civics_representative_contact_modal_close',
    'civics_representative_contact_send',
    'civics_representative_contact_send_error',
    'civics_representative_contact_template_select',
    'civics_representative_contact_template_clear',
    'civics_representative_contact_launch',
  ]);

const isSingleEventData = (
  data: CivicsRepresentativeEventMap[CivicsRepresentativeEventName],
): data is CivicsRepresentativeEventBase =>
  'representativeId' in data;

const isBulkEventData = (
  data: CivicsRepresentativeEventMap[CivicsRepresentativeEventName],
): data is CivicsRepresentativeBulkEventBase =>
  'representativeIds' in data;

const getRepresentativeIdFromEvent = (
  value: CivicsRepresentativeEventMap[CivicsRepresentativeEventName],
): string | undefined => {
  if (isSingleEventData(value) && value.representativeId != null) {
    return String(value.representativeId);
  }

  if (isBulkEventData(value) && value.representativeIds.length > 0) {
    return String(value.representativeIds[0]);
  }

  return undefined;
};

export function trackCivicsRepresentativeEvent<
  E extends CivicsRepresentativeEventName = CivicsRepresentativeEventName,
>(
  trackEvent: AnalyticsActions['trackEvent'] | undefined,
  event: CivicsRepresentativeEventRecord<E>,
) {
  if (!trackEvent) {
    return;
  }

  const label = event.label ?? getRepresentativeIdFromEvent(event.data);

  const analyticsEvent: Omit<AnalyticsEvent, 'id' | 'sessionId' | 'timestamp'> = {
    event_type: event.type,
    type: 'civics',
    category: 'civics',
    action: CIVICS_REPRESENTATIVE_ACTION_MAP[event.type],
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


