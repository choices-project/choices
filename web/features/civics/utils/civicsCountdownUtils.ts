import { useEffect, useMemo } from 'react';

import {
  useClearElections,
  useElectionError,
  useElectionLoading,
  useElectionsForDivisions,
  useFetchElectionsForDivisions,
} from '@/lib/stores';
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

export const formatElectionDate = (isoDate: string | undefined): string => {
  if (!isoDate) {
    return '';
  }

  try {
    return new Date(isoDate).toLocaleDateString(undefined, {
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
};

export const useElectionCountdown = (
  divisionIds: string[],
  { autoFetch = true, clearOnEmpty = false }: ElectionCountdownOptions = {},
) => {
  const fetchElections = useFetchElectionsForDivisions();
  const clearElections = useClearElections();
  const elections = useElectionsForDivisions(divisionIds);
  const loading = useElectionLoading();
  const error = useElectionError();

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


