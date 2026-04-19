/**
 * Hashtag Moderation Store - Zustand Implementation
 * 
 * Manages hashtag moderation state including flagging interface,
 * moderation queue, and form state management.
 * 
 * Created: January 15, 2025
 * Status: ✅ ACTIVE
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { fetchAuthCsrfToken } from '@/features/auth/lib/csrf-token';

import { logger } from '@/lib/utils/logger';

import { createBaseStoreActions } from './baseStoreActions';
import { createSafeStorage } from './storage';

import type { BaseStore } from './types';
import type { StateCreator } from 'zustand';

// Hashtag moderation types
export type HashtagFlagType = 'inappropriate' | 'spam' | 'misleading' | 'harassment' | 'other';

export type HashtagModerationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

export type HashtagFlag = {
  id: string;
  hashtagId: string;
  flagType: HashtagFlagType;
  reason: string;
  userId: string;
  timestamp: string;
  status: HashtagModerationStatus;
}

export type HashtagModeration = {
  id: string;
  hashtagId: string;
  status: HashtagModerationStatus;
  flags: HashtagFlag[];
  moderatorId?: string;
  moderatorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

type HashtagModerationState = {
  // Modal state
  isOpen: boolean;
  
  // Form state
  flagType: HashtagFlagType;
  reason: string;
  
  // Submission state
  isSubmitting: boolean;
  error: string | null;
  
  // Moderation queue
  moderationQueue: HashtagModeration[];
  selectedModeration: HashtagModeration | null;
  isLoading: boolean;
};

type HashtagModerationActions = Pick<
  BaseStore,
  'setLoading' | 'setError' | 'clearError'
> & {
  // Actions - Modal
  setIsOpen: (open: boolean) => void;

  // Actions - Form
  setFlagType: (type: HashtagFlagType) => void;
  setReason: (reason: string) => void;
  resetForm: () => void;

  // Actions - Submission
  setIsSubmitting: (submitting: boolean) => void;

  // Actions - Moderation
  setModerationQueue: (queue: HashtagModeration[]) => void;
  setSelectedModeration: (moderation: HashtagModeration | null) => void;
  addModeration: (moderation: HashtagModeration) => void;
  updateModeration: (id: string, updates: Partial<HashtagModeration>) => void;
  removeModeration: (id: string) => void;

  // Actions - Flags
  submitFlag: (hashtagId: string) => Promise<void>;
  approveFlag: (flagId: string) => Promise<void>;
  rejectFlag: (flagId: string) => Promise<void>;

  // Actions - Queue management
  loadModerationQueue: () => Promise<void>;
  refreshQueue: () => Promise<void>;

  // Reset
  resetHashtagModerationState: () => void;
};

type HashtagModerationStore = HashtagModerationState & HashtagModerationActions;

type HashtagModerationStoreCreator = StateCreator<
  HashtagModerationStore,
  [['zustand/immer', never], ['zustand/persist', unknown], ['zustand/devtools', never]]
>;

const createInitialHashtagModerationState = (): HashtagModerationState => ({
  isOpen: false,
  flagType: 'inappropriate',
  reason: '',
  isSubmitting: false,
  error: null,
  moderationQueue: [],
  selectedModeration: null,
  isLoading: false,
});

type ModerationQueueApiItem = {
  id: string;
  created_at: string;
  updated_at: string;
  moderation: {
    status: string;
    flags?: Array<{
      id: string;
      hashtag_id: string;
      user_id: string;
      flag_type: string;
      reason: string;
      status: string;
      created_at: string;
    }>;
  };
};

function mapFlagStatusForStore(raw: string): HashtagModerationStatus {
  if (raw === 'pending') return 'pending';
  if (raw === 'rejected') return 'rejected';
  if (raw === 'resolved' || raw === 'approved') return 'approved';
  return 'under_review';
}

function mapApiQueueItemToStoreModeration(item: ModerationQueueApiItem): HashtagModeration {
  const modStatus = item.moderation.status;
  const status: HashtagModerationStatus =
    modStatus === 'approved'
      ? 'approved'
      : modStatus === 'rejected'
        ? 'rejected'
        : modStatus === 'pending'
          ? 'pending'
          : 'under_review';

  const allowed: HashtagFlagType[] = ['inappropriate', 'spam', 'misleading', 'harassment', 'other'];

  const flags: HashtagFlag[] = (item.moderation.flags ?? []).map((f) => {
    const ft = allowed.includes(f.flag_type as HashtagFlagType)
      ? (f.flag_type as HashtagFlagType)
      : 'other';
    return {
      id: f.id,
      hashtagId: f.hashtag_id,
      flagType: ft,
      reason: f.reason,
      userId: f.user_id,
      timestamp: f.created_at,
      status: mapFlagStatusForStore(f.status),
    };
  });

  return {
    id: item.id,
    hashtagId: item.id,
    status,
    flags,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

const createHashtagModerationActions = (
  set: Parameters<HashtagModerationStoreCreator>[0],
  get: Parameters<HashtagModerationStoreCreator>[1],
): HashtagModerationActions => {
  const setState = set as unknown as (recipe: (draft: HashtagModerationStore) => void) => void;
  const baseActions = createBaseStoreActions<HashtagModerationStore>(setState);

  return {
    ...baseActions,
    setIsOpen: (open) =>
      setState((state) => {
        state.isOpen = open;

        if (open) {
          state.flagType = 'inappropriate';
          state.reason = '';
          state.error = null;
        }
      }),
    setFlagType: (type) =>
      setState((state) => {
        state.flagType = type;
      }),
    setReason: (reason) =>
      setState((state) => {
        state.reason = reason;
      }),
    resetForm: () =>
      setState((state) => {
        state.flagType = 'inappropriate';
        state.reason = '';
        state.isSubmitting = false;
        state.error = null;
      }),
    setIsSubmitting: (submitting) =>
      setState((state) => {
        state.isSubmitting = submitting;
      }),
    setModerationQueue: (queue) =>
      setState((state) => {
        state.moderationQueue = queue;
      }),
    setSelectedModeration: (moderation) =>
      setState((state) => {
        state.selectedModeration = moderation;
      }),
    addModeration: (moderation) =>
      setState((state) => {
        state.moderationQueue.unshift(moderation);
      }),
    updateModeration: (id, updates) =>
      setState((state) => {
        const index = state.moderationQueue.findIndex((m) => m.id === id);
        if (index === -1) {
          return;
        }

        const existing = state.moderationQueue[index];
        if (!existing) {
          return;
        }

        const nextModeration = {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        state.moderationQueue[index] = nextModeration;

        if (state.selectedModeration?.id === id) {
          state.selectedModeration = nextModeration;
        }
      }),
    removeModeration: (id) =>
      setState((state) => {
        state.moderationQueue = state.moderationQueue.filter((m) => m.id !== id);
        if (state.selectedModeration?.id === id) {
          state.selectedModeration = null;
        }
      }),
    submitFlag: async (hashtagId) => {
      const { flagType, reason } = get();

      if (!reason.trim()) {
        baseActions.setError('Please provide a reason for flagging');
        return;
      }

      baseActions.clearError();
      setState((state) => {
        state.isSubmitting = true;
      });

      try {
        const { useUserStore } = await import('@/lib/stores/userStore');
        const userStore = useUserStore.getState();
        const userId = userStore.user?.id ?? 'anonymous';

        const flag: HashtagFlag = {
          id: crypto.randomUUID(),
          hashtagId,
          flagType,
          reason,
          userId,
          timestamp: new Date().toISOString(),
          status: 'pending',
        };

        const csrf = await fetchAuthCsrfToken();
        if (!csrf) {
          throw new Error('Unable to obtain CSRF token. Please refresh and try again.');
        }
        const response = await fetch('/api/hashtags?action=flag', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf,
          },
          body: JSON.stringify(flag),
        });

        if (!response.ok) {
          throw new Error(`Failed to submit flag: ${response.statusText}`);
        }

        setState((state) => {
          state.isSubmitting = false;
          state.isOpen = false;
          state.flagType = 'inappropriate';
          state.reason = '';
        });

        logger.info('Flag submitted', { flag });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to submit flag';
        baseActions.setError(errorMessage);
        setState((state) => {
          state.isSubmitting = false;
        });
      }
    },
    approveFlag: async (flagId) => {
      baseActions.clearError();
      baseActions.setLoading(true);

      try {
        const csrf = await fetchAuthCsrfToken();
        if (!csrf) {
          throw new Error('Unable to obtain CSRF token. Please refresh and try again.');
        }
        const response = await fetch(`/api/hashtags?action=approve&flagId=${flagId}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to approve flag: ${response.statusText}`);
        }

        setState((state) => {
          state.moderationQueue.forEach((moderation) => {
            const flag = moderation.flags?.find((f) => f.id === flagId);
            if (flag) {
              flag.status = 'approved';
              moderation.updatedAt = new Date().toISOString();
            }
          });
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to approve flag';
        baseActions.setError(errorMessage);
      } finally {
        baseActions.setLoading(false);
      }
    },
    rejectFlag: async (flagId) => {
      baseActions.clearError();
      baseActions.setLoading(true);

      try {
        const csrf = await fetchAuthCsrfToken();
        if (!csrf) {
          throw new Error('Unable to obtain CSRF token. Please refresh and try again.');
        }
        const response = await fetch(`/api/hashtags?action=reject&flagId=${flagId}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to reject flag: ${response.statusText}`);
        }

        setState((state) => {
          state.moderationQueue.forEach((moderation) => {
            const flag = moderation.flags?.find((f) => f.id === flagId);
            if (flag) {
              flag.status = 'rejected';
              moderation.updatedAt = new Date().toISOString();
            }
          });
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to reject flag';
        baseActions.setError(errorMessage);
      } finally {
        baseActions.setLoading(false);
      }
    },
    loadModerationQueue: async () => {
      baseActions.clearError();
      baseActions.setLoading(true);

      try {
        const response = await fetch('/api/hashtags?action=moderation-queue', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load moderation queue: ${response.statusText}`);
        }

        const body = (await response.json()) as {
          success?: boolean;
          data?: ModerationQueueApiItem[];
        };

        const queueItems = body.success && Array.isArray(body.data) ? body.data : null;
        if (!queueItems) {
          throw new Error('Invalid moderation queue response');
        }

        setState((state) => {
          state.moderationQueue = queueItems.map(mapApiQueueItemToStoreModeration);
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load moderation queue';
        baseActions.setError(errorMessage);
      } finally {
        baseActions.setLoading(false);
      }
    },
    refreshQueue: async () => {
      await get().loadModerationQueue();
    },
    resetHashtagModerationState: () =>
      setState((state) => {
        Object.assign(state, createInitialHashtagModerationState());
      }),
  };
};

const hashtagModerationStoreCreator: HashtagModerationStoreCreator = (set, get) => ({
  ...createInitialHashtagModerationState(),
  ...createHashtagModerationActions(set, get),
});

type PersistedHashtagModerationState = Pick<
  HashtagModerationState,
  'flagType' | 'reason'
>;

export const useHashtagModerationStore = create<HashtagModerationStore>()(
  devtools(
    persist(
      immer(hashtagModerationStoreCreator),
      {
        name: 'hashtag-moderation-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          flagType: state.flagType,
          reason: state.reason,
        }),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...(persistedState as PersistedHashtagModerationState),
        }),
      }
    ),
    { name: 'hashtag-moderation-store' }
  )
);

export const useModerationModal = () =>
  useHashtagModerationStore((state) => state.isOpen);

export const useModerationForm = () =>
  useHashtagModerationStore((state) => ({
    flagType: state.flagType,
    reason: state.reason,
    isSubmitting: state.isSubmitting,
    error: state.error,
  }));

export const useModerationQueue = () =>
  useHashtagModerationStore((state) => state.moderationQueue);
export const useSelectedModeration = () =>
  useHashtagModerationStore((state) => state.selectedModeration);
export const useModerationLoading = () =>
  useHashtagModerationStore((state) => state.isLoading);
export const useModerationError = () =>
  useHashtagModerationStore((state) => state.error);

export const useModerationActions = () => {
  const setIsOpen = useHashtagModerationStore((state) => state.setIsOpen);
  const setFlagType = useHashtagModerationStore((state) => state.setFlagType);
  const setReason = useHashtagModerationStore((state) => state.setReason);
  const resetForm = useHashtagModerationStore((state) => state.resetForm);
  const setIsSubmitting = useHashtagModerationStore((state) => state.setIsSubmitting);
  const setError = useHashtagModerationStore((state) => state.setError);
  const clearError = useHashtagModerationStore((state) => state.clearError);
  const setLoading = useHashtagModerationStore((state) => state.setLoading);
  const setModerationQueue = useHashtagModerationStore((state) => state.setModerationQueue);
  const setSelectedModeration = useHashtagModerationStore((state) => state.setSelectedModeration);
  const addModeration = useHashtagModerationStore((state) => state.addModeration);
  const updateModeration = useHashtagModerationStore((state) => state.updateModeration);
  const removeModeration = useHashtagModerationStore((state) => state.removeModeration);
  const submitFlag = useHashtagModerationStore((state) => state.submitFlag);
  const approveFlag = useHashtagModerationStore((state) => state.approveFlag);
  const rejectFlag = useHashtagModerationStore((state) => state.rejectFlag);
  const loadModerationQueue = useHashtagModerationStore((state) => state.loadModerationQueue);
  const refreshQueue = useHashtagModerationStore((state) => state.refreshQueue);
  const resetHashtagModerationState = useHashtagModerationStore((state) => state.resetHashtagModerationState);

  return useMemo(
    () => ({
      setIsOpen,
      setFlagType,
      setReason,
      resetForm,
      setIsSubmitting,
      setError,
      clearError,
      setLoading,
      setModerationQueue,
      setSelectedModeration,
      addModeration,
      updateModeration,
      removeModeration,
      submitFlag,
      approveFlag,
      rejectFlag,
      loadModerationQueue,
      refreshQueue,
      resetHashtagModerationState,
    }),
    [
      setIsOpen,
      setFlagType,
      setReason,
      resetForm,
      setIsSubmitting,
      setError,
      clearError,
      setLoading,
      setModerationQueue,
      setSelectedModeration,
      addModeration,
      updateModeration,
      removeModeration,
      submitFlag,
      approveFlag,
      rejectFlag,
      loadModerationQueue,
      refreshQueue,
      resetHashtagModerationState,
    ]
  );
};

export const useModerationStats = () =>
  useHashtagModerationStore((state) => {
    const queue = state.moderationQueue;
    return {
      total: queue.length,
      pending: queue.filter((m) => m.status === 'pending').length,
      approved: queue.filter((m) => m.status === 'approved').length,
      rejected: queue.filter((m) => m.status === 'rejected').length,
      underReview: queue.filter((m) => m.status === 'under_review').length,
    };
  });

export const usePendingFlags = () =>
  useHashtagModerationStore((state) =>
    state.moderationQueue.flatMap((m) =>
      m.flags.filter((f) => f.status === 'pending')
    )
  );

export const moderationStoreUtils = {
  getFlagTypeLabel: (type: HashtagFlagType): string => {
    const labels = {
      inappropriate: 'Inappropriate Content',
      spam: 'Spam',
      misleading: 'Misleading',
      harassment: 'Harassment',
      other: 'Other',
    };
    return labels[type];
  },

  getStatusColor: (status: HashtagModerationStatus): string => {
    const colors = {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
      under_review: 'blue',
    };
    return colors[status];
  },

  canSubmitFlag: (reason: string): boolean => reason.trim().length > 0,
};

export const useModerationSubscription = () => {
  const store = useHashtagModerationStore();

  return {
    subscribe: (callback: (state: HashtagModerationStore) => void) =>
      useHashtagModerationStore.subscribe(callback),
    getState: () => store,
  };
};

export const useModerationDebug = () => {
  const state = useHashtagModerationStore();

  return {
    state,
    actions: useModerationActions(),
    stats: useModerationStats(),
  };
};
