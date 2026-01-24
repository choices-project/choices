import { useCallback, useMemo } from 'react';

import { useAnalyticsActions, useRepresentativeDivisions } from '@/lib/stores';


import {
  CIVICS_REPRESENTATIVE_SINGLE_EVENT_SET,
  type CivicsRepresentativeEventMap,
  type CivicsRepresentativeEventBase,
  type CivicsRepresentativeEventRecord,
  type CivicsRepresentativeSingleEventName,
  trackCivicsRepresentativeEvent,
} from '../analytics/civicsAnalyticsEvents';
import { useElectionCountdown } from '../utils/civicsCountdownUtils';
import { filterDivisionsForElections, getRepresentativeDivisionIds } from '../utils/divisions';

import type { Representative } from '@/types/representative';

type RepresentativeCtaAnalyticsOptions = {
  source?: string;
  autoFetch?: boolean;
};

export const useRepresentativeCtaAnalytics = (
  representative: Partial<Representative> | null | undefined,
  { source = 'unknown', autoFetch = true }: RepresentativeCtaAnalyticsOptions = {},
) => {
  const representativeId = representative?.id ?? null;
  const storeDivisionIds = useRepresentativeDivisions(representativeId);
  const fallbackDivisions = useMemo(
    () => getRepresentativeDivisionIds(representative),
    [representative],
  );
  const divisionIds = useMemo(
    () => filterDivisionsForElections(
      storeDivisionIds.length > 0 ? storeDivisionIds : fallbackDivisions,
    ),
    [storeDivisionIds, fallbackDivisions],
  );

  const {
    elections,
    nextElection,
    daysUntilNextElection,
    loading,
    error,
  } = useElectionCountdown(divisionIds, {
    autoFetch,
    analytics: {
      surface: source,
      ...(representativeId
        ? { metadata: { representativeId } as Record<string, unknown> }
        : {}),
    },
  });

  const baseEventData = useMemo<CivicsRepresentativeEventBase>(
    () => ({
      representativeId,
      representativeName: representative?.name ?? null,
      divisionIds,
      nextElectionId: nextElection?.election_id ?? null,
      nextElectionDay: nextElection?.election_day ?? null,
      electionCountdownDays: daysUntilNextElection ?? null,
      source,
    }),
    [
      daysUntilNextElection,
      divisionIds,
      nextElection?.election_day,
      nextElection?.election_id,
      representative?.name,
      representativeId,
      source,
    ],
  );

  const { trackEvent } = useAnalyticsActions();

  type Extras<E extends CivicsRepresentativeSingleEventName> = Omit<
    CivicsRepresentativeEventMap[E],
    keyof CivicsRepresentativeEventBase
  >;

  const trackCtaEvent = useCallback(
    <E extends CivicsRepresentativeSingleEventName>(
      eventType: E,
      extras?: Extras<E>,
      options?: { value?: number; metadata?: Record<string, unknown>; label?: string },
    ) => {
      if (!CIVICS_REPRESENTATIVE_SINGLE_EVENT_SET.has(eventType)) {
        throw new Error(`Unsupported civics representative event: ${eventType}`);
      }

      const data = {
        ...baseEventData,
        ...(extras ?? {}),
      } as CivicsRepresentativeEventMap[E];

      const eventRecord: CivicsRepresentativeEventRecord<E> = {
        type: eventType,
        data,
      };

      if (options?.value !== undefined) {
        eventRecord.value = options.value;
      }

      if (options?.metadata !== undefined) {
        eventRecord.metadata = options.metadata;
      }

      if (options?.label !== undefined) {
        eventRecord.label = options.label;
      }

      trackCivicsRepresentativeEvent(trackEvent, eventRecord);
    },
    [baseEventData, trackEvent],
  );

  return {
    divisionIds,
    elections,
    nextElection,
    daysUntilNextElection,
    loading,
    error,
    /** Rep-level "up for election" from representatives_core. Prefer over division-based when present. */
    repNextElectionDate: representative?.next_election_date ?? null,
    trackCtaEvent,
  };
};

