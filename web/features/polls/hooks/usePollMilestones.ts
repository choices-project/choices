import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNotificationActions } from '@/lib/stores';

const STORAGE_KEY = 'choices.poll.milestones';
const DEFAULT_MILESTONES = [10, 25, 50, 100, 250, 500] as const;

type Milestone = (typeof DEFAULT_MILESTONES)[number];

type MilestonePreferences = Record<Milestone, boolean>;

type StoredPollMilestoneState = {
  preferences: Partial<Record<Milestone, boolean>>;
  acknowledged: Milestone[];
  updatedAt: string;
};

type PollMilestoneState = {
  preferences: MilestonePreferences;
  acknowledged: Milestone[];
};

type StorageShape = Record<string, StoredPollMilestoneState>;

const createDefaultPreferences = (): MilestonePreferences => {
  const base = {} as MilestonePreferences;
  DEFAULT_MILESTONES.forEach((milestone) => {
    base[milestone] = milestone <= 50;
  });
  return base;
};

const createDefaultState = (): PollMilestoneState => ({
  preferences: createDefaultPreferences(),
  acknowledged: [],
});

const readStorage = (): StorageShape => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StorageShape;
  } catch {
    return {};
  }
};

const writeStorage = (storage: StorageShape) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch {
    // Ignore storage errors (e.g. quota exceeded)
  }
};

const mergeWithDefaults = (stored?: StoredPollMilestoneState | null): PollMilestoneState => {
  const defaults = createDefaultState();
  if (!stored) {
    return defaults;
  }

  const mergedPreferences: MilestonePreferences = { ...defaults.preferences };
  Object.entries(stored.preferences ?? {}).forEach(([key, value]) => {
    const milestone = Number(key) as Milestone;
    if (DEFAULT_MILESTONES.includes(milestone)) {
      mergedPreferences[milestone] = Boolean(value);
    }
  });

  return {
    preferences: mergedPreferences,
    acknowledged: Array.from(new Set(stored.acknowledged ?? [])).filter((milestone) =>
      DEFAULT_MILESTONES.includes(milestone),
    ) as Milestone[],
  };
};

export const POLL_MILESTONES = DEFAULT_MILESTONES;

export type PollMilestone = Milestone;

export const usePollMilestoneState = (pollId: string | null) => {
  const [state, setState] = useState<PollMilestoneState>(createDefaultState);
  const [isReady, setIsReady] = useState(false);
  const currentPollIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pollId || typeof window === 'undefined') {
      currentPollIdRef.current = null;
      setState(createDefaultState());
      setIsReady(false);
      return;
    }

    currentPollIdRef.current = pollId;
    const storage = readStorage();
    const stored = storage[pollId];
    setState(mergeWithDefaults(stored));
    setIsReady(true);
  }, [pollId]);

  const persist = useCallback((updater: (prev: PollMilestoneState) => PollMilestoneState) => {
    setState((prev) => {
      const updated = updater(prev);
      const pollKey = currentPollIdRef.current;
      if (pollKey) {
        const storage = readStorage();
        storage[pollKey] = {
          preferences: updated.preferences,
          acknowledged: updated.acknowledged,
          updatedAt: new Date().toISOString(),
        };
        writeStorage(storage);
      }
      return updated;
    });
  }, []);

  const updatePreference = useCallback(
    (milestone: Milestone, enabled: boolean) => {
      const pollKey = currentPollIdRef.current;
      if (!pollKey) return;
      persist((prev) => ({
        preferences: Object.assign({}, prev.preferences, { [milestone]: enabled }),
        acknowledged: prev.acknowledged,
      }));
    },
    [persist],
  );

  const acknowledgeMilestone = useCallback(
    (milestone: Milestone) => {
      const pollKey = currentPollIdRef.current;
      if (!pollKey) return;
      persist((prev) => {
        if (prev.acknowledged.includes(milestone)) {
          return prev;
        }
        return {
          preferences: prev.preferences,
          acknowledged: [...prev.acknowledged, milestone],
        };
      });
    },
    [persist],
  );

  const resetAcknowledged = useCallback(() => {
    const pollKey = currentPollIdRef.current;
    if (!pollKey) return;
    persist((prev) => ({
      acknowledged: prev.acknowledged.filter((milestone) => prev.preferences[milestone]),
      preferences: prev.preferences,
    }));
  }, [persist]);

  return {
    pollId: currentPollIdRef.current,
    milestones: POLL_MILESTONES,
    preferences: state.preferences,
    acknowledged: state.acknowledged,
    isReady,
    updatePreference,
    acknowledgeMilestone,
    resetAcknowledged,
  };
};

type UsePollMilestoneNotificationsParams = {
  pollId: string | null;
  totalVotes: number;
  onMilestoneReached?: (milestone: Milestone) => void;
};

export const usePollMilestoneNotifications = ({
  pollId,
  totalVotes,
  onMilestoneReached,
}: UsePollMilestoneNotificationsParams) => {
  const {
    pollId: activePollId,
    milestones,
    preferences,
    acknowledged,
    isReady,
    acknowledgeMilestone,
    updatePreference,
  } = usePollMilestoneState(pollId);
  const { addNotification } = useNotificationActions();

  useEffect(() => {
    if (!activePollId || !isReady) return;

    milestones.forEach((milestone) => {
      const thresholdMet = totalVotes >= milestone;
      const optedIn = preferences[milestone];
      const alreadyAcknowledged = acknowledged.includes(milestone);

      if (thresholdMet && optedIn && !alreadyAcknowledged) {
        acknowledgeMilestone(milestone);
        addNotification({
          type: 'success',
          title: `Milestone reached: ${milestone} votes`,
          message: `Your poll just crossed ${milestone.toLocaleString()} votes. Keep momentum going by sharing again.`,
          duration: 6000,
        });
        onMilestoneReached?.(milestone);
      }
    });
  }, [acknowledgeMilestone, acknowledged, addNotification, isReady, milestones, onMilestoneReached, preferences, totalVotes, activePollId]);

  const reachedMilestones = useMemo(
    () => milestones.filter((milestone) => totalVotes >= milestone),
    [milestones, totalVotes],
  );

  const nextMilestone = useMemo(() => {
    const upcoming = milestones.find((milestone) => totalVotes < milestone);
    return upcoming ?? null;
  }, [milestones, totalVotes]);

  const enabledMilestones = useMemo(
    () => milestones.filter((milestone) => preferences[milestone]),
    [milestones, preferences],
  );

  return {
    pollId: activePollId,
    milestones,
    preferences,
    enabledMilestones,
    reachedMilestones,
    nextMilestone,
    isReady,
    updatePreference,
  };
};
