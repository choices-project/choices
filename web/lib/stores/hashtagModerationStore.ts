/**
 * Hashtag Moderation Store - Zustand Implementation
 * 
 * Manages hashtag moderation state including flagging interface,
 * moderation queue, and form state management.
 * 
 * Created: January 15, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { logger } from '@/lib/utils/logger';

import type { BaseStore } from './types';

// Hashtag moderation types
export type HashtagFlagType = 'inappropriate' | 'spam' | 'misleading' | 'harassment' | 'other';

export type HashtagModerationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

export interface HashtagFlag {
  id: string;
  hashtagId: string;
  flagType: HashtagFlagType;
  reason: string;
  userId: string;
  timestamp: string;
  status: HashtagModerationStatus;
}

export interface HashtagModeration {
  id: string;
  hashtagId: string;
  status: HashtagModerationStatus;
  flags: HashtagFlag[];
  moderatorId?: string;
  moderatorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Store state interface
type HashtagModerationStore = {
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
  
  // Actions - Modal
  setIsOpen: (open: boolean) => void;
  
  // Actions - Form
  setFlagType: (type: HashtagFlagType) => void;
  setReason: (reason: string) => void;
  resetForm: () => void;
  
  // Actions - Submission
  setIsSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  
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
} & BaseStore;

// Create hashtag moderation store with middleware
export const useHashtagModerationStore = create<HashtagModerationStore>()(
  devtools(
    persist(
      immer((set, _get) => ({
        // Initial state
        isOpen: false,
        flagType: 'inappropriate',
        reason: '',
        isSubmitting: false,
        error: null,
        moderationQueue: [],
        selectedModeration: null,
        isLoading: false,
        
        // Base store actions
        setLoading: (loading) => set((state) => {
          state.isLoading = loading;
        }),
        
        setError: (error) => set((state) => {
          state.error = error;
        }),
        
        clearError: () => set((state) => {
          state.error = null;
        }),
        
        // Modal actions
        setIsOpen: (open) => set((state) => {
          state.isOpen = open;
          
          // Reset form when opening
          if (open) {
            state.flagType = 'inappropriate';
            state.reason = '';
            state.error = null;
          }
        }),
        
        // Form actions
        setFlagType: (type) => set((state) => {
          state.flagType = type;
        }),
        
        setReason: (reason) => set((state) => {
          state.reason = reason;
        }),
        
        resetForm: () => set((state) => {
          state.flagType = 'inappropriate';
          state.reason = '';
          state.isSubmitting = false;
          state.error = null;
        }),
        
        // Submission actions
        setIsSubmitting: (submitting) => set((state) => {
          state.isSubmitting = submitting;
        }),
        
        // Moderation actions
        setModerationQueue: (queue) => set((state) => {
          state.moderationQueue = queue;
        }),
        
        setSelectedModeration: (moderation) => set((state) => {
          state.selectedModeration = moderation;
        }),
        
        addModeration: (moderation) => set((state) => {
          state.moderationQueue.unshift(moderation);
        }),
        
        updateModeration: (id, updates) => set((state) => {
          const index = state.moderationQueue.findIndex(m => m.id === id);
          if (index !== -1) {
            const existing = state.moderationQueue[index];
            if (existing) {
              state.moderationQueue[index] = {
                ...existing,
                ...updates,
                updatedAt: new Date().toISOString(),
              };
            }
          }
        }),
        
        removeModeration: (id) => set((state) => {
          state.moderationQueue = state.moderationQueue.filter(m => m.id !== id);
        }),
        
        // Flag actions
        submitFlag: async (hashtagId) => {
          const state = _get();
          if (!state.reason.trim()) {
            set((state) => {
              state.error = 'Please provide a reason for flagging';
            });
            return;
          }
          
          set((state) => {
            state.isSubmitting = true;
            state.error = null;
          });
          
          try {
            // Get user ID from user store
            const { useUserStore } = await import('@/lib/stores/userStore');
            const userStore = useUserStore.getState();
            const userId = userStore.user?.id || 'anonymous';
            
            const flag: HashtagFlag = {
              id: crypto.randomUUID(),
              hashtagId,
              flagType: state.flagType,
              reason: state.reason,
              userId,
              timestamp: new Date().toISOString(),
              status: 'pending',
            };
            
            // Submit flag to API
            const response = await fetch('/api/hashtags?action=flag', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(flag),
            });
            
            if (!response.ok) {
              throw new Error(`Failed to submit flag: ${response.statusText}`);
            }
            
            // Reset form after successful submission
            set((state) => {
              state.isSubmitting = false;
              state.isOpen = false;
              state.flagType = 'inappropriate';
              state.reason = '';
            });
            
            logger.info('Flag submitted', { flag });
          } catch (error) {
            set((state) => {
              state.isSubmitting = false;
              state.error = error instanceof Error ? error.message : 'Failed to submit flag';
            });
          }
        },
        
        approveFlag: async (flagId) => {
          set((state) => {
            state.isLoading = true;
          });
          
          try {
            // Approve flag via API
            const response = await fetch(`/api/hashtags?action=approve&flagId=${flagId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!response.ok) {
              throw new Error(`Failed to approve flag: ${response.statusText}`);
            }
            
            set((state) => {
              const flagIndex = state.moderationQueue.findIndex(m => 
                m.flags?.some(f => f.id === flagId)
              );
              if (flagIndex !== -1) {
                const moderation = state.moderationQueue[flagIndex];
                if (moderation) {
                  const flag = moderation.flags?.find(f => f.id === flagId);
                  if (flag) {
                    flag.status = 'approved';
                  }
                }
              }
              state.isLoading = false;
            });
            
            // Flag approved successfully
          } catch (error) {
            set((state) => {
              state.isLoading = false;
              state.error = error instanceof Error ? error.message : 'Failed to approve flag';
            });
          }
        },
        
        rejectFlag: async (flagId) => {
          set((state) => {
            state.isLoading = true;
          });
          
          try {
            // Reject flag via API
            const response = await fetch(`/api/hashtags?action=reject&flagId=${flagId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!response.ok) {
              throw new Error(`Failed to reject flag: ${response.statusText}`);
            }
            
            set((state) => {
              const flagIndex = state.moderationQueue.findIndex(m => 
                m.flags?.some(f => f.id === flagId)
              );
              if (flagIndex !== -1) {
                const moderation = state.moderationQueue[flagIndex];
                if (moderation) {
                  const flag = moderation.flags?.find(f => f.id === flagId);
                  if (flag) {
                    flag.status = 'rejected';
                  }
                }
              }
              state.isLoading = false;
            });
            
            // Flag rejected successfully
          } catch (error) {
            set((state) => {
              state.isLoading = false;
              state.error = error instanceof Error ? error.message : 'Failed to reject flag';
            });
          }
        },
        
        // Queue management actions
        loadModerationQueue: async () => {
          set((state) => {
            state.isLoading = true;
          });
          
          try {
            // Load moderation queue from API
            const response = await fetch('/api/hashtags?action=moderation-queue', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!response.ok) {
              throw new Error(`Failed to load moderation queue: ${response.statusText}`);
            }
            
            const moderationQueue = await response.json();
            
            set((state) => {
              state.moderationQueue = moderationQueue;
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.isLoading = false;
              state.error = error instanceof Error ? error.message : 'Failed to load moderation queue';
            });
          }
        },
        
        refreshQueue: async () => {
          const { loadModerationQueue } = _get();
          await loadModerationQueue();
        },
      })),
      {
        name: 'hashtag-moderation-store',
        partialize: (state) => ({
          flagType: state.flagType,
          reason: state.reason,
        }),
      }
    ),
    { name: 'hashtag-moderation-store' }
  )
);

// Store selectors for optimized re-renders
export const useModerationModal = () => useHashtagModerationStore(state => state.isOpen);
export const useModerationForm = () => useHashtagModerationStore(
  state => ({
    flagType: state.flagType,
    reason: state.reason,
    isSubmitting: state.isSubmitting,
    error: state.error,
  })
);

export const useModerationQueue = () => useHashtagModerationStore(state => state.moderationQueue);
export const useSelectedModeration = () => useHashtagModerationStore(state => state.selectedModeration);
export const useModerationLoading = () => useHashtagModerationStore(state => state.isLoading);
export const useModerationError = () => useHashtagModerationStore(state => state.error);

// Action selectors
export const useModerationActions = () => useHashtagModerationStore(state => ({
  setIsOpen: state.setIsOpen,
  setFlagType: state.setFlagType,
  setReason: state.setReason,
  resetForm: state.resetForm,
  setIsSubmitting: state.setIsSubmitting,
  setError: state.setError,
  setModerationQueue: state.setModerationQueue,
  setSelectedModeration: state.setSelectedModeration,
  addModeration: state.addModeration,
  updateModeration: state.updateModeration,
  removeModeration: state.removeModeration,
  submitFlag: state.submitFlag,
  approveFlag: state.approveFlag,
  rejectFlag: state.rejectFlag,
  loadModerationQueue: state.loadModerationQueue,
  refreshQueue: state.refreshQueue,
}));

// Computed selectors
export const useModerationStats = () => useHashtagModerationStore(state => {
  const queue = state.moderationQueue;
  return {
    total: queue.length,
    pending: queue.filter(m => m.status === 'pending').length,
    approved: queue.filter(m => m.status === 'approved').length,
    rejected: queue.filter(m => m.status === 'rejected').length,
    underReview: queue.filter(m => m.status === 'under_review').length,
  };
});

export const usePendingFlags = () => useHashtagModerationStore(state => 
  state.moderationQueue.flatMap(m => m.flags.filter(f => f.status === 'pending'))
);

// Store utilities
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
  
  canSubmitFlag: (reason: string): boolean => {
    return reason.trim().length > 0;
  },
};

// Store subscriptions
export const useModerationSubscription = () => {
  const store = useHashtagModerationStore();
  
  return {
    subscribe: (callback: (state: HashtagModerationStore) => void) => {
      return useHashtagModerationStore.subscribe(callback);
    },
    getState: () => store,
  };
};

// Store debugging
export const useModerationDebug = () => {
  const state = useHashtagModerationStore();
  
  return {
    state,
    actions: useModerationActions(),
    stats: useModerationStats(),
  };
};
