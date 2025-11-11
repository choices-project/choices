import { useCallback } from 'react';

import { useAnalyticsStore } from '@/lib/stores';

export type PollEventOptions = {
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
};

export type PollEventMetadataFactory =
  | Record<string, unknown>
  | (() => Record<string, unknown> | null | undefined)
  | null
  | undefined;

/**
 * Shared hook that records poll-specific analytics events while respecting consent.
 */
export const useRecordPollEvent = (baseMetadata?: PollEventMetadataFactory) => {
  const { trackEvent, sessionId } = useAnalyticsStore((state) => ({
    trackEvent: state.trackEvent,
    sessionId: state.sessionId,
  }));

  return useCallback(
    (action: string, options: PollEventOptions = {}) => {
      if (typeof trackEvent !== 'function') {
        return;
      }

      const resolvedBaseMetadata =
        typeof baseMetadata === 'function' ? baseMetadata() ?? {} : baseMetadata ?? {};

      const mergedMetadata = {
        ...resolvedBaseMetadata,
        ...(options.metadata ?? {}),
      };

      trackEvent({
        event_type: 'poll_event',
        type: 'poll_event',
        category: options.category ?? 'poll_interaction',
        action,
        event_data: {
          action,
          category: options.category ?? 'poll_interaction',
          metadata: mergedMetadata,
        },
        created_at: new Date().toISOString(),
        session_id: sessionId ?? 'anonymous',
        metadata: mergedMetadata,
        ...(options.label !== undefined ? { label: options.label } : {}),
        ...(options.value !== undefined ? { value: options.value } : {}),
      });
    },
    [baseMetadata, sessionId, trackEvent],
  );
};
