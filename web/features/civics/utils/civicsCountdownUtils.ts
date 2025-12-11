import { useEffect, useMemo, useRef } from 'react';

import {
  useAnalyticsActions,
  useClearElections,
  useElectionError,
  useElectionLoading,
  useElectionsForDivisions,
  useFetchElectionsForDivisions,
} from '@/lib/stores';
import { notificationStoreUtils } from '@/lib/stores/notificationStore';
import type { ElectionNotificationContext , Notification as NotificationModel } from '@/lib/stores/types';

import { useI18n } from '@/hooks/useI18n';

import type { CivicElection } from '@/types/civic';

export const getElectionCountdown = (isoDate: string | undefined): number | null => {
  if (!isoDate) {
    return null;
  }

  const now = new Date();
  const target = new Date(isoDate);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return null;
  }

  return diffDays;
};

export const formatElectionDate = (
  isoDate: string | undefined,
  locale?: string,
): string => {
  if (!isoDate) {
    return '';
  }

  try {
    return new Date(isoDate).toLocaleDateString(locale ?? undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
};

type ElectionCountdownOptions = {
  autoFetch?: boolean;
  clearOnEmpty?: boolean;
  notify?: boolean;
  notificationSource?: ElectionNotificationContext['source'];
  notificationThresholdDays?: number;
  notificationType?: NotificationModel['type'];
  representativeNames?: string[];
  analytics?: {
    surface: string;
    eventType?: string;
    metadata?: Record<string, unknown>;
  };
};

export const useElectionCountdown = (
  divisionIds: string[],
  {
    autoFetch = true,
    clearOnEmpty = false,
    notify = false,
    notificationSource = 'notification-center',
    notificationThresholdDays = 7,
    notificationType = 'info',
    representativeNames,
    analytics,
  }: ElectionCountdownOptions = {},
) => {
  const { t, currentLanguage } = useI18n();
  const fetchElections = useFetchElectionsForDivisions();
  const clearElections = useClearElections();
  const elections = useElectionsForDivisions(divisionIds);
  const loading = useElectionLoading();
  const error = useElectionError();
  const { trackEvent } = useAnalyticsActions();

  const upcomingElections = useMemo(() => {
    if (!Array.isArray(elections) || elections.length === 0) {
      return [];
    }

    return [...elections].sort(
      (a, b) => new Date(a.election_day).getTime() - new Date(b.election_day).getTime(),
    );
  }, [elections]);

  const nextElection = upcomingElections[0] ?? null;
  const daysUntilNextElection = useMemo(
    () => getElectionCountdown(nextElection?.election_day),
    [nextElection?.election_day],
  );

  const deliveredNotificationsRef = useRef<Set<string>>(new Set());
  const trackedAnalyticsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!notify) {
      return;
    }

    if (upcomingElections.length === 0) {
      return;
    }

    upcomingElections.forEach((election) => {
      const daysUntil = getElectionCountdown(election.election_day);

      if (daysUntil === null) {
        return;
      }

      if (daysUntil > notificationThresholdDays) {
        return;
      }

      const notificationKey = `${election.election_id ?? ''}:${election.ocd_division_id ?? ''}:${notificationSource}`;
      if (deliveredNotificationsRef.current.has(notificationKey)) {
        return;
      }

      const countdownLabel =
        daysUntil === 0
          ? t('civics.countdown.notifications.countdown.today')
          : daysUntil === 1
            ? t('civics.countdown.notifications.countdown.tomorrow')
            : t('civics.countdown.notifications.countdown.inDays', {
                count: daysUntil,
              });
      const formattedDate = formatElectionDate(election.election_day, currentLanguage);
      const notificationTitle =
        election.name ?? t('civics.countdown.notifications.titleFallback');

      notificationStoreUtils.createElectionNotification({
        title: notificationTitle,
        message: t('civics.countdown.notifications.message', { date: formattedDate }),
        countdownLabel,
        electionId: election.election_id,
        divisionId: election.ocd_division_id,
        electionDate: election.election_day,
        daysUntil,
        source: notificationSource,
        notificationType,
        ...(representativeNames ? { representativeNames } : {}),
      });

      deliveredNotificationsRef.current.add(notificationKey);
    });
  }, [
    notify,
    notificationSource,
    notificationThresholdDays,
    notificationType,
    representativeNames,
    upcomingElections,
    currentLanguage,
    t,
  ]);

  useEffect(() => {
    if (!analytics?.surface || typeof trackEvent !== 'function') {
      return;
    }

    if (!nextElection?.election_id) {
      return;
    }

    const key = `${analytics.surface}:${nextElection.election_id}`;
    if (trackedAnalyticsRef.current.has(key)) {
      return;
    }

    trackedAnalyticsRef.current.add(key);

    trackEvent({
      event_type: analytics.eventType ?? 'civics.election.countdown.view',
      type: 'civics',
      category: 'civics',
      action: 'election_countdown_view',
      value: 1,
      created_at: new Date().toISOString(),
      session_id: '',
      event_data: {
        surface: analytics.surface,
        division_ids: divisionIds,
        election_id: nextElection.election_id,
        election_day: nextElection.election_day,
        days_until: daysUntilNextElection,
        total_upcoming: upcomingElections.length,
        notify_enabled: notify,
        notification_threshold_days: notificationThresholdDays,
        representative_names: representativeNames ?? [],
        ...(analytics.metadata ?? {}),
      },
    });
  }, [
    analytics?.eventType,
    analytics?.metadata,
    analytics?.surface,
    daysUntilNextElection,
    divisionIds,
    nextElection?.election_day,
    nextElection?.election_id,
    notify,
    notificationThresholdDays,
    representativeNames,
    trackEvent,
    upcomingElections.length,
  ]);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    if (divisionIds.length === 0) {
      if (clearOnEmpty) {
        clearElections();
      }
      return;
    }

    if (upcomingElections.length > 0 || loading) {
      return;
    }

    void fetchElections(divisionIds);
  }, [
    autoFetch,
    clearOnEmpty,
    clearElections,
    divisionIds,
    fetchElections,
    loading,
    upcomingElections.length,
  ]);

  return {
    divisionIds,
    elections: upcomingElections,
    nextElection,
    daysUntilNextElection,
    loading,
    error,
  } as {
    divisionIds: string[];
    elections: CivicElection[];
    nextElection: CivicElection | null;
    daysUntilNextElection: number | null;
    loading: boolean;
    error: string | null;
  };
};


