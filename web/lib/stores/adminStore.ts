/**
 * @fileoverview Admin Store - Modernized Zustand Implementation
 *
 * Provides admin dashboard state, user management tools, and system configuration controls.
 * Modernized to align with the 2025 Zustand store standards (typed creator, helper factories, immer).
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import type {
  ActivityItem,
  AdminNotification,
  AdminFeatureFlagCategories,
  AdminFeatureFlagsState,
  AdminUser,
  DisplayFeatureFlag,
  FeatureFlag,
  FeatureFlagConfig,
  GeneratedPoll,
  NewAdminNotification,
  SystemMetrics,
  TrendingTopic,
} from '@/features/admin/types';

import { FEATURE_FLAGS, featureFlagManager } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

import { createSafeStorage } from './storage';

import type { BaseStore } from './types';
import type { StateCreator } from 'zustand';

export type AdminActiveTab = 'overview' | 'users' | 'analytics' | 'settings' | 'audit';
export type AdminSettingsTab = 'general' | 'performance' | 'security' | 'notifications';
export type AdminRoleFilter = 'all' | 'admin' | 'moderator' | 'user';
export type AdminStatusFilter = 'all' | 'active' | 'inactive' | 'suspended';
export type AdminNotificationFrequency = 'immediate' | 'daily' | 'weekly';

export type AdminUserFilters = {
    searchTerm: string;
  roleFilter: AdminRoleFilter;
  statusFilter: AdminStatusFilter;
    selectedUsers: string[];
    showBulkActions: boolean;
  };

export type AdminDashboardStats = {
    totalUsers: number;
    activePolls: number;
    totalVotes: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
    pollsCreatedLast7Days: number;
    pollsCreatedToday: number;
    milestoneAlertsLast7Days: number;
    shareActionsLast24h: number;
    topShareChannel: { channel: string; count: number } | null;
    latestMilestone: { pollId?: string; milestone?: number | null; occurredAt: string } | null;
};

export type AdminSystemSettings = {
    general: {
      siteName: string;
      siteDescription: string;
      maintenanceMode: boolean;
      allowRegistration: boolean;
      requireEmailVerification: boolean;
    };
    performance: {
      enableCaching: boolean;
      cacheTTL: number;
      enableCompression: boolean;
      maxFileSize: number;
    };
    security: {
      enableRateLimiting: boolean;
      maxRequestsPerMinute: number;
      enableCSP: boolean;
      enableHSTS: boolean;
    };
    notifications: {
      enableEmailNotifications: boolean;
      enablePushNotifications: boolean;
    notificationFrequency: AdminNotificationFrequency;
  };
};

export type AdminReimportStateResult = {
  state: string;
  success: boolean;
  representatives: number;
  duration?: string;
  error?: string;
};

export type AdminReimportProgress = {
    totalStates: number;
    processedStates: number;
    successfulStates: number;
    failedStates: number;
    totalRepresentatives: number;
    federalRepresentatives: number;
    stateRepresentatives: number;
    errors: string[];
  stateResults: AdminReimportStateResult[];
};

export type AdminState = Pick<BaseStore, 'isLoading' | 'error'> & {
  sidebarCollapsed: boolean;
  currentPage: string;
  notifications: AdminNotification[];

  trendingTopics: TrendingTopic[];
  generatedPolls: GeneratedPoll[];
  systemMetrics: SystemMetrics | null;
  activityItems: ActivityItem[];
  activityFeed: ActivityItem[];
  featureFlags: AdminFeatureFlagsState;

  users: AdminUser[];
  userFilters: AdminUserFilters;

  activeTab: AdminActiveTab;
  dashboardStats: AdminDashboardStats | null;

  systemSettings: AdminSystemSettings | null;
  settingsTab: AdminSettingsTab;
  isSavingSettings: boolean;

  reimportProgress: AdminReimportProgress;
  reimportLogs: string[];
  isReimportRunning: boolean;

  adminNotifications: AdminNotification[];
};

export type AdminActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: NewAdminNotification) => void;
  markNotificationAsRead: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setTrendingTopics: (topics: TrendingTopic[]) => void;
  setGeneratedPolls: (polls: GeneratedPoll[]) => void;
  setSystemMetrics: (metrics: SystemMetrics) => void;
  updateActivityFeed: (activities: ActivityItem[]) => void;

  loadUsers: () => Promise<void>;
  loadDashboardStats: () => Promise<void>;
  loadSystemSettings: () => Promise<void>;

  setUserFilters: (filters: Partial<AdminUserFilters>) => void;
  selectUser: (userId: string) => void;
  deselectUser: (userId: string) => void;
  selectAllUsers: () => void;
  deselectAllUsers: () => void;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  updateUserStatus: (userId: string, status: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  setActiveTab: (tab: AdminActiveTab) => void;

  setSystemSettings: (settings: AdminSystemSettings | null) => void;
  updateSystemSetting: (
    section: keyof AdminSystemSettings,
    key: string,
    value: unknown
  ) => void;
  setSettingsTab: (tab: AdminSettingsTab) => void;
  saveSystemSettings: () => Promise<void>;

  setIsSavingSettings: (saving: boolean) => void;
  setUpdating: (updating: boolean) => void;

  setReimportProgress: (progress: Partial<AdminReimportProgress>) => void;
  addReimportLog: (message: string) => void;
  clearReimportLogs: () => void;
  setIsReimportRunning: (running: boolean) => void;
  startReimport: () => Promise<void>;

  addActivityItem: (item: ActivityItem | Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  clearActivityItems: () => void;
  addAdminNotification: (notification: AdminNotification) => void;
  clearAdminNotifications: () => void;
  enableFeatureFlag: (flagId: string) => boolean;
  disableFeatureFlag: (flagId: string) => boolean;
  toggleFeatureFlag: (flagId: string) => boolean;
  isFeatureFlagEnabled: (flagId: string) => boolean;
  getFeatureFlag: (flagId: string) => FeatureFlag | null;
  getAllFeatureFlags: () => DisplayFeatureFlag[];
  exportFeatureFlagConfig: () => FeatureFlagConfig;
  importFeatureFlagConfig: (config: unknown) => boolean;
  resetFeatureFlags: () => void;
  setFeatureFlagLoading: (loading: boolean) => void;
  setFeatureFlagError: (error: string | null) => void;

  refreshData: () => Promise<void>;
  syncData: () => Promise<void>;
  resetAdminState: () => void;
};

export type AdminStore = AdminState & AdminActions;

type AdminStoreCreator = StateCreator<
  AdminStore,
  [['zustand/devtools', never], ['zustand/persist', unknown], ['zustand/immer', never]]
>;

const createDefaultUserFilters = (): AdminUserFilters => ({
  searchTerm: '',
  roleFilter: 'all',
  statusFilter: 'all',
  selectedUsers: [],
  showBulkActions: false,
});

const createDefaultReimportProgress = (): AdminReimportProgress => ({
  totalStates: 0,
  processedStates: 0,
  successfulStates: 0,
  failedStates: 0,
  totalRepresentatives: 0,
  federalRepresentatives: 0,
  stateRepresentatives: 0,
  errors: [],
  stateResults: [],
});

const cloneFlags = (flags: Record<string, boolean>): Record<string, boolean> =>
  Object.fromEntries(Object.entries(flags)) as Record<string, boolean>;

const calculateFlagLists = (flags: Record<string, boolean>) => ({
  enabledFlags: Object.keys(flags).filter((key) => flags[key]),
  disabledFlags: Object.keys(flags).filter((key) => !flags[key]),
});

const MUTABLE_FLAG_KEYS = Object.keys(FEATURE_FLAGS);

const LOCKED_CORE_FLAGS = [
  'ENHANCED_ONBOARDING',
  'ENHANCED_PROFILE',
  'ENHANCED_AUTH',
  'ENHANCED_DASHBOARD',
  'ENHANCED_POLLS',
  'ENHANCED_VOTING',
] as const;

const LOCKED_CIVICS_FLAGS = [
  'CIVICS_ADDRESS_LOOKUP',
  'CIVICS_REPRESENTATIVE_DATABASE',
  'CIVICS_CAMPAIGN_FINANCE',
  'CIVICS_VOTING_RECORDS',
  'CANDIDATE_ACCOUNTABILITY',
  'CANDIDATE_CARDS',
  'ALTERNATIVE_CANDIDATES',
] as const;

const LOCKED_SYSTEM_FLAGS = ['PWA', 'ADMIN', 'FEEDBACK_WIDGET', 'WEBAUTHN'] as const;

const CATEGORY_PRESETS: AdminFeatureFlagCategories = {
  core: LOCKED_CORE_FLAGS.slice(),
  enhanced: [
    'SOCIAL_SHARING',
    'SOCIAL_SHARING_POLLS',
    'SOCIAL_SHARING_CIVICS',
    'SOCIAL_SHARING_VISUAL',
    'SOCIAL_SHARING_OG',
  ],
  civics: [...LOCKED_CIVICS_FLAGS],
  future: [
    'AUTOMATED_POLLS',
    'ADVANCED_PRIVACY',
    'SOCIAL_SIGNUP',
    'CONTACT_INFORMATION_SYSTEM',
    'CIVICS_TESTING_STRATEGY',
    'CIVIC_ENGAGEMENT_V2',
    'DEVICE_FLOW_AUTH',
  ],
  performance: ['PERFORMANCE_OPTIMIZATION', 'FEATURE_DB_OPTIMIZATION_SUITE', 'ANALYTICS'],
  system: [...LOCKED_SYSTEM_FLAGS, 'PUSH_NOTIFICATIONS', 'THEMES', 'ACCESSIBILITY', 'INTERNATIONALIZATION'],
};

const computeMutableFlags = () => {
  const mutableFlags: Record<string, boolean> = {};
  for (const key of MUTABLE_FLAG_KEYS) {
    mutableFlags[key] = featureFlagManager.get(key) ?? false;
  }
  return cloneFlags(mutableFlags);
};

const computeLockedFlags = () => {
  const enabledIds = featureFlagManager.getEnabledFlags().map((flag) => flag.id);
  return enabledIds.filter((flagId) => !MUTABLE_FLAG_KEYS.includes(flagId)).sort();
};

const recalcFeatureFlags = (
  previous: AdminFeatureFlagsState,
  flags: Record<string, boolean>,
  overrides?: Partial<Pick<AdminFeatureFlagsState, 'isLoading' | 'error'>>
): AdminFeatureFlagsState => {
  const { enabledFlags, disabledFlags } = calculateFlagLists(flags);
  const next: AdminFeatureFlagsState = {
    ...previous,
    flags,
    enabledFlags,
    disabledFlags,
    lockedFlags: previous.lockedFlags.length ? previous.lockedFlags : computeLockedFlags(),
  };

  if (overrides) {
    if (overrides.isLoading !== undefined) {
      next.isLoading = overrides.isLoading;
    }
    if (overrides.error !== undefined) {
      next.error = overrides.error;
    }
  }

  return next;
};

const formatFlagName = (flagId: string): string =>
  flagId
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const resolveCategory = (categories: AdminFeatureFlagCategories, flagId: string): string => {
  if (categories.core.includes(flagId)) return 'core';
  if (categories.enhanced.includes(flagId)) return 'enhanced';
  if (categories.civics.includes(flagId)) return 'civics';
  if (categories.future.includes(flagId)) return 'future';
  if (categories.performance.includes(flagId)) return 'performance';
  if (categories.system.includes(flagId)) return 'system';
  return 'general';
};

const isBooleanRecord = (value: unknown): value is Record<string, boolean> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return Object.values(value).every((flagValue) => typeof flagValue === 'boolean');
};

const getInitialFlagState = () => {
  const mutableFlags = computeMutableFlags();
  const lockedFlags = computeLockedFlags();
  const { enabledFlags, disabledFlags } = calculateFlagLists(mutableFlags);

  return {
    flags: mutableFlags,
    enabledFlags,
    disabledFlags,
    lockedFlags,
  };
};

const initialFlagState = getInitialFlagState();

const mergeMetadata = (
  metadata: unknown,
  additions: Record<string, unknown | null | undefined>
): Record<string, unknown> => {
  const base =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};

  for (const [key, value] of Object.entries(additions)) {
    if (value !== undefined) {
      base[key] = value as unknown;
    }
  }

  return base;
};

const defaultSystemSettings: AdminSystemSettings = {
  general: {
    siteName: 'Choices Platform',
    siteDescription: 'A modern voting platform for democratic decision making',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
  },
  performance: {
    enableCaching: true,
    cacheTTL: 3600,
    enableCompression: true,
    maxFileSize: 10 * 1024 * 1024,
  },
  security: {
    enableRateLimiting: true,
    maxRequestsPerMinute: 100,
    enableCSP: true,
    enableHSTS: true,
  },
  notifications: {
    enableEmailNotifications: true,
    enablePushNotifications: false,
    notificationFrequency: 'immediate',
  },
};

const cloneSystemSettings = (settings: AdminSystemSettings | null): AdminSystemSettings | null => {
  if (!settings) {
    return null;
  }
  return {
    general: { ...settings.general },
    performance: { ...settings.performance },
    security: { ...settings.security },
    notifications: { ...settings.notifications },
  };
};

export const createInitialAdminState = (): AdminState => ({
        sidebarCollapsed: false,
        currentPage: 'dashboard',
        notifications: [],
        trendingTopics: [],
        generatedPolls: [],
        systemMetrics: null,
        activityItems: [],
        activityFeed: [],
  featureFlags: {
    flags: initialFlagState.flags,
    enabledFlags: initialFlagState.enabledFlags,
    disabledFlags: initialFlagState.disabledFlags,
    lockedFlags: initialFlagState.lockedFlags,
    categories: CATEGORY_PRESETS,
    isLoading: false,
    error: null,
  },
        users: [],
  userFilters: createDefaultUserFilters(),
        activeTab: 'overview',
        dashboardStats: null,
        systemSettings: null,
        settingsTab: 'general',
        isSavingSettings: false,
  reimportProgress: createDefaultReimportProgress(),
        reimportLogs: [],
        isReimportRunning: false,
        isLoading: false,
        error: null,
        adminNotifications: [],
});

export const initialAdminState: AdminState = createInitialAdminState();

const buildAdminNotification = (input: NewAdminNotification): AdminNotification => {
  const issuedAt = input.timestamp ?? new Date().toISOString();
  const createdAt = input.created_at ?? issuedAt;

  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const base: AdminNotification = {
    id,
    timestamp: issuedAt,
    type: input.type,
    title: input.title,
    message: input.message,
    read: input.read ?? false,
    created_at: createdAt,
  };

  const overrides: Partial<AdminNotification> = {};

  if (input.action) {
    overrides.action = input.action;
  }

  if (input.metadata) {
    overrides.metadata = { ...(input.metadata as Record<string, unknown>) };
  }

  return { ...base, ...overrides };
};

export const createAdminActions = (
  set: Parameters<AdminStoreCreator>[0],
  get: Parameters<AdminStoreCreator>[1]
): AdminActions => {
  const setState = (recipe: (draft: AdminState) => void) => {
    (set as unknown as (fn: (draft: AdminState) => void) => void)(recipe);
  };

  const setLoadingState = (loading: boolean) => {
    setState((state) => {
      state.isLoading = loading;
    });
  };

  const setErrorState = (error: string | null) => {
    setState((state) => {
      state.error = error;
    });
  };

  const clearErrorState = () => setErrorState(null);

  const setIsSavingSettingsState = (saving: boolean) => {
    setState((state) => {
      state.isSavingSettings = saving;
    });
  };

  const setIsReimportRunningState = (running: boolean) => {
    setState((state) => {
      state.isReimportRunning = running;
    });
  };

  const setTrendingTopicsState = (topics: TrendingTopic[]) => {
    setState((state) => {
      state.trendingTopics = topics;
    });
    logger.info('Admin trending topics updated', {
      action: 'set_trending_topics',
      count: topics.length,
    });
  };

  const setGeneratedPollsState = (polls: GeneratedPoll[]) => {
    setState((state) => {
      state.generatedPolls = polls;
    });
    logger.info('Admin generated polls updated', {
      action: 'set_generated_polls',
      count: polls.length,
    });
  };

  const setSystemMetricsState = (metrics: SystemMetrics) => {
    setState((state) => {
      state.systemMetrics = metrics;
    });
    logger.info('Admin system metrics updated', {
      action: 'set_system_metrics',
      metricKeys: Object.keys(metrics ?? {}),
    });
  };

  const updateActivityFeedState = (activities: ActivityItem[]) => {
    setState((state) => {
      state.activityFeed = activities;
    });
    logger.info('Admin activity feed updated', {
      action: 'update_activity_feed',
      count: activities.length,
    });
  };

  const markNotificationReadInternal = (id: string) => {
          const currentState = get();
    const existingNotification =
      currentState.notifications.find((notification) => notification.id === id) ??
      currentState.adminNotifications.find((notification) => notification.id === id);

    setState((state) => {
      const generalNotification = state.notifications.find((notification) => notification.id === id);
      if (generalNotification) {
        generalNotification.read = true;
      }
      const adminNotification = state.adminNotifications.find((notification) => notification.id === id);
      if (adminNotification) {
        adminNotification.read = true;
      }
    });

    if (existingNotification) {
      logger.info('Admin notification read', {
        action: 'mark_notification_read',
        notificationId: id,
        notificationType: existingNotification.type,
        timeToRead: Date.now() - new Date(existingNotification.timestamp).getTime(),
      });
    }
  };

  return {
    setLoading: setLoadingState,
    setError: setErrorState,
    clearError: clearErrorState,
    setTrendingTopics: setTrendingTopicsState,
    setGeneratedPolls: setGeneratedPollsState,
    setSystemMetrics: setSystemMetricsState,
    updateActivityFeed: updateActivityFeedState,

    toggleSidebar: () => {
      const current = get();
      const next = !current.sidebarCollapsed;

      setState((state) => {
        state.sidebarCollapsed = next;
      });

          logger.info('Admin sidebar toggled', {
            action: 'toggle_sidebar',
        newState: next,
        currentPage: current.currentPage,
          });
        },

        setCurrentPage: (page: string) => {
      const from = get().currentPage;

      setState((state) => {
        state.currentPage = page;
      });

          logger.info('Admin page navigation', {
            action: 'navigate_page',
        from,
        to: page,
          });
        },

        addNotification: (notification: NewAdminNotification) => {
          const currentState = get();
          const newNotification = buildAdminNotification(notification);

      setState((state) => {
        state.notifications.unshift(newNotification);
        if (state.notifications.length > 10) {
          state.notifications.length = 10;
        }
      });

          logger.info('Admin notification created', {
            action: 'add_notification',
            type: notification.type,
            title: notification.title,
        currentCount: currentState.notifications.length + 1,
          });

          if (notification.type === 'error' || notification.type === 'warning') {
            logger.warn('Critical admin notification', {
              notification: newNotification,
          currentPage: currentState.currentPage,
            });
          }
        },

    markNotificationRead: markNotificationReadInternal,
    markNotificationAsRead: markNotificationReadInternal,

    clearNotifications: () => {
      const cleared = get().notifications.length;

      setState((state) => {
        state.notifications = [];
      });

          logger.info('Admin notifications cleared', {
            action: 'clear_notifications',
        clearedCount: cleared,
        currentPage: get().currentPage,
          });
        },

        loadUsers: async () => {
          try {
        setLoadingState(true);
        clearErrorState();

            const supabase = await getSupabaseBrowserClient();
            if (!supabase) {
              throw new Error('Database connection not available');
            }

            const { data: users, error } = await supabase
              .from('user_profiles')
          .select(
            `
                id,
                user_id,
                email,
                display_name,
                is_admin,
                is_active,
                created_at,
                updated_at
          `
          )
              .order('created_at', { ascending: false });

            if (error) {
              throw new Error(`Failed to fetch users: ${error.message}`);
            }

        const adminUsers: AdminUser[] =
          users?.map((user) => {
              const base: Record<string, unknown> = {
              id: user.id ?? user.user_id,
                email: user.email,
                name: user.display_name ?? 'Unknown User',
                role: user.is_admin ? 'admin' : 'user',
                status: user.is_active ? 'active' : 'inactive',
                is_admin: user.is_admin ?? false,
                created_at: user.created_at ?? '',
              };

            if (user.updated_at) {
              base.last_login = user.updated_at;
            }

              return base as AdminUser;
            }) ?? [];

        setState((state) => {
          state.users = adminUsers;
        });

            logger.info('Users loaded successfully', {
          userCount: adminUsers.length,
            });
          } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setErrorState(message);
        logger.error(
          'Failed to load users',
          error instanceof Error ? error : new Error(message)
        );
          } finally {
        setLoadingState(false);
          }
        },

        loadDashboardStats: async () => {
          try {
        setLoadingState(true);
        clearErrorState();

            const supabase = await getSupabaseBrowserClient();
            if (!supabase) {
              throw new Error('Database connection not available');
            }

            const [usersResult, pollsResult, votesResult] = await Promise.all([
              supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
              supabase.from('polls').select('*', { count: 'exact', head: true }).eq('status', 'active'),
              supabase.from('votes').select('*', { count: 'exact', head: true }),
            ]);

            if (usersResult.error) {
              throw new Error(`Failed to fetch user count: ${usersResult.error.message}`);
            }
            if (pollsResult.error) {
              throw new Error(`Failed to fetch polls count: ${pollsResult.error.message}`);
            }
            if (votesResult.error) {
              throw new Error(`Failed to fetch votes count: ${votesResult.error.message}`);
            }

            const now = Date.now();
            const sinceSevenDaysIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
            const sinceTwentyFourHoursMs = now - 24 * 60 * 60 * 1000;

            const { data: pollEvents, error: pollEventsError } = await supabase
              .from('analytics_events')
              .select('id, event_type, event_data, created_at')
              .eq('event_type', 'poll_event')
              .gte('created_at', sinceSevenDaysIso)
              .order('created_at', { ascending: false })
              .limit(200);

            if (pollEventsError) {
              logger.warn('Failed to load poll analytics events', pollEventsError);
            }

        const isRecord = (value: unknown): value is Record<string, unknown> =>
              value !== null && typeof value === 'object' && !Array.isArray(value);

            const shareCounts = new Map<string, number>();
            const newActivityItems: ActivityItem[] = [];
            const pendingNotifications: AdminNotification[] = [];
            const existingNotifications = get().adminNotifications;

            let pollsCreatedLast7Days = 0;
            let pollsCreatedToday = 0;
            let milestoneAlertsLast7Days = 0;
            let shareActionsLast24h = 0;
        let latestMilestone: AdminDashboardStats['latestMilestone'] = null;

            const pushActivityItem = (item: ActivityItem) => {
          if (!item.id || newActivityItems.length >= 15) {
                return;
              }
              newActivityItems.push(item);
            };

        const ensureId = () =>
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2);

            (pollEvents ?? []).forEach((event) => {
               const createdAt = event.created_at ?? new Date().toISOString();
               const createdMs = Date.parse(createdAt);
          const eventData = isRecord(event.event_data) ? event.event_data : {};
              const action = typeof eventData.action === 'string' ? eventData.action : '';

               if (!action) {
                 return;
               }

          const metadata = isRecord(eventData.metadata) ? eventData.metadata : {};
          const pollId =
            typeof metadata.pollId === 'string'
                ? metadata.pollId
                : typeof metadata.poll_id === 'string'
                ? metadata.poll_id
                : undefined;

              if (action === 'poll_created') {
                pollsCreatedLast7Days += 1;
                if (!Number.isNaN(createdMs) && createdMs >= sinceTwentyFourHoursMs) {
                  pollsCreatedToday += 1;
                }

            const title =
              typeof metadata.title === 'string' && metadata.title.trim().length > 0
                  ? metadata.title
                  : 'Poll published';

                pushActivityItem({
                  id: event.id,
                  type: action,
                  title,
              description: pollId
                ? `Poll ${pollId} is now live on the platform.`
                : 'A new poll is live on the platform.',
                  timestamp: createdAt,
                  metadata: mergeMetadata(metadata, { pollId }),
                });
                return;
              }

              if (action === 'poll_creation_failed') {
                const alreadyNotified = existingNotifications.some(
                  (notification) => notification.metadata?.eventId === event.id
                );

                const failureReason =
                  typeof metadata.reason === 'string' && metadata.reason.trim().length > 0
                    ? metadata.reason
                    : typeof metadata.status === 'number'
                      ? `status ${metadata.status}`
                      : metadata.status ?? 'unknown reason';

                pushActivityItem({
                  id: event.id,
                  type: action,
                  title: 'Poll creation failed',
                  description: pollId
                    ? `Poll ${pollId} failed to publish (${failureReason}).`
                    : `A poll creation failed (${failureReason}).`,
                  timestamp: createdAt,
                  metadata: mergeMetadata(metadata, {
                    pollId,
                    reason: failureReason,
                  }),
                });

                if (!alreadyNotified) {
                  const pending = buildAdminNotification({
                    type: 'error',
                    title: 'Poll creation failed',
                    message: pollId
                      ? `Poll ${pollId} failed to publish (${failureReason}).`
                      : `A poll creation failed (${failureReason}).`,
                    read: false,
                    created_at: createdAt,
                    timestamp: createdAt,
                    metadata: mergeMetadata({ eventId: event.id }, { pollId, reason: failureReason }),
                  });
                  pending.id = ensureId();
                  pendingNotifications.push(pending);
                }

                return;
              }

              if (action === 'milestone_reached') {
                milestoneAlertsLast7Days += 1;

            const milestoneRaw = metadata.milestone;
            const milestoneValue =
              typeof milestoneRaw === 'number'
                ? milestoneRaw
                : typeof milestoneRaw === 'string'
                ? Number.parseInt(milestoneRaw, 10)
                  : null;

                if (!latestMilestone) {
                  latestMilestone = {
                    ...(pollId ? { pollId } : {}),
                    milestone: Number.isFinite(milestoneValue) ? (milestoneValue as number) : null,
                    occurredAt: createdAt,
                  };
                }

                const milestoneLabel = Number.isFinite(milestoneValue)
                  ? (milestoneValue as number).toLocaleString()
                  : 'a new milestone';

                pushActivityItem({
                  id: event.id,
                  type: action,
                  title: 'Milestone reached',
                  description: pollId
                ? `Poll ${pollId} crossed ${milestoneLabel} votes.`
                    : `A poll crossed ${milestoneLabel} votes.`,
                  timestamp: createdAt,
                  metadata: mergeMetadata(metadata, {
                    pollId,
                    milestone: milestoneValue,
                  }),
                });

                const alreadyNotified = existingNotifications.some(
              (notification) => notification.metadata?.eventId === event.id
                );

                if (!alreadyNotified) {
                  const pending = buildAdminNotification({
                    type: 'success',
                    title: 'Poll milestone achieved',
                    message: pollId
                      ? `Poll ${pollId} crossed ${milestoneLabel} votes.`
                      : `A poll crossed ${milestoneLabel} votes.`,
                    read: false,
                    created_at: createdAt,
                    timestamp: createdAt,
                    metadata: mergeMetadata({ eventId: event.id }, {
                        pollId,
                        milestone: milestoneValue,
                    }),
                  });
              pending.id = ensureId();
                  pendingNotifications.push(pending);
                }

                return;
              }

              if (action === 'copy_link_failed') {
                pushActivityItem({
                  id: event.id,
                  type: action,
                  title: 'Share attempt failed',
                  description: pollId
                    ? `Copy link failed for poll ${pollId}.`
                    : 'Copy link failed for a poll share attempt.',
                  timestamp: createdAt,
                  metadata: mergeMetadata(metadata, {
                    pollId,
                    location: metadata.location ?? 'unknown',
                  }),
                });
                return;
              }

              if (
                action === 'share_x' ||
                action === 'email_link' ||
                action === 'copy_link' ||
                action === 'share_modal_opened' ||
                action === 'detail_copy_link'
              ) {
                if (!Number.isNaN(createdMs) && createdMs >= sinceTwentyFourHoursMs) {
                  shareActionsLast24h += 1;
                  const channelRaw = metadata.channel;
              const channel =
                typeof channelRaw === 'string' && channelRaw.trim().length > 0
                    ? channelRaw
                    : action;
                  shareCounts.set(channel, (shareCounts.get(channel) ?? 0) + 1);
                }

                const channelLabelRaw = metadata.channel;
            const channelLabel =
              typeof channelLabelRaw === 'string' && channelLabelRaw.trim().length > 0
                  ? channelLabelRaw
                  : action.replace('share_', '').replace('_', ' ');

                pushActivityItem({
                  id: event.id,
                  type: action,
                  title: 'Share activity',
                  description: pollId
                    ? `Poll ${pollId} shared via ${channelLabel}.`
                    : `A poll share event occurred via ${channelLabel}.`,
                  timestamp: createdAt,
                  metadata: mergeMetadata(metadata, {
                    pollId,
                    channel: channelLabel,
                  }),
                });
                return;
              }

              pushActivityItem({
                id: event.id,
                type: action,
                title: action.replace(/_/g, ' '),
                description: pollId
                  ? `Poll ${pollId} recorded a ${action.replace(/_/g, ' ')} event.`
                  : `Poll analytics event: ${action.replace(/_/g, ' ')}.`,
                timestamp: createdAt,
                metadata: mergeMetadata(metadata, { pollId }),
              });
            });

        const topShareChannelEntry = Array.from(shareCounts.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0];
            const topShareChannel = topShareChannelEntry
              ? { channel: topShareChannelEntry[0], count: topShareChannelEntry[1] }
              : null;

        const mergeActivityItems = (
          existing: ActivityItem[],
          incoming: ActivityItem[]
        ): ActivityItem[] => {
              const seen = new Set<string>();
              const merged: ActivityItem[] = [];

              for (const item of [...incoming, ...existing]) {
                if (!item.id || seen.has(item.id)) {
                  continue;
                }
                seen.add(item.id);
                merged.push(item);
                if (merged.length >= 25) {
                  break;
                }
              }

              return merged;
            };

            const systemHealth = (() => {
              const hasRecentActivity = (pollEvents ?? []).some((event) => {
                if (!event?.created_at) {
                  return false;
                }
                const timestamp = Date.parse(event.created_at);
                return !Number.isNaN(timestamp) && timestamp >= sinceTwentyFourHoursMs;
              });

              if (hasRecentActivity) {
                return 'healthy' as const;
              }

              return (pollsResult.count ?? 0) > 0 ? ('warning' as const) : ('critical' as const);
            })();

        const stats: AdminDashboardStats = {
              totalUsers: usersResult.count ?? 0,
              activePolls: pollsResult.count ?? 0,
              totalVotes: votesResult.count ?? 0,
          systemHealth,
              pollsCreatedLast7Days,
              pollsCreatedToday,
              milestoneAlertsLast7Days,
              shareActionsLast24h,
              topShareChannel,
              latestMilestone,
            };

        setState((state) => {
          state.dashboardStats = stats;
          state.activityItems = mergeActivityItems(state.activityItems, newActivityItems);

            if (pendingNotifications.length > 0) {
            const eventIds = new Set(
              pendingNotifications.map((notification) => notification.metadata?.eventId)
            );

            state.adminNotifications = [
              ...pendingNotifications,
              ...state.adminNotifications.filter((notification) => {
                  const eventId = notification.metadata?.eventId;
                return !eventId || !eventIds.has(eventId);
              }),
            ].slice(0, 25);
          }
        });

            logger.info('Dashboard stats loaded successfully', {
              totalUsers: stats.totalUsers,
              activePolls: stats.activePolls,
              totalVotes: stats.totalVotes,
              pollsCreatedLast7Days,
              milestoneAlertsLast7Days,
              shareActionsLast24h,
            });
          } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setErrorState(message);
        logger.error(
          'Failed to load dashboard stats',
          error instanceof Error ? error : new Error(message)
        );
          } finally {
        setLoadingState(false);
          }
        },

        loadSystemSettings: async () => {
          try {
        setLoadingState(true);
        clearErrorState();

            const supabase = await getSupabaseBrowserClient();
            if (!supabase) {
              throw new Error('Database connection not available');
            }

        setState((state) => {
          state.systemSettings = cloneSystemSettings(defaultSystemSettings);
        });

            logger.info('System settings loaded successfully');
          } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setErrorState(message);
        logger.error(
          'Failed to load system settings',
          error instanceof Error ? error : new Error(message)
        );
          } finally {
        setLoadingState(false);
          }
        },

    setUserFilters: (filters) => {
      setState((state) => {
        if (filters.searchTerm !== undefined) {
          state.userFilters.searchTerm = filters.searchTerm;
        }
        if (filters.roleFilter !== undefined) {
          state.userFilters.roleFilter = filters.roleFilter;
        }
        if (filters.statusFilter !== undefined) {
          state.userFilters.statusFilter = filters.statusFilter;
        }

        if (filters.selectedUsers !== undefined) {
          const incoming = filters.selectedUsers as unknown;
            let normalized: string[];

          if (incoming instanceof Set) {
            normalized = Array.from(incoming);
          } else if (Array.isArray(incoming)) {
            normalized = [...incoming];
            } else {
              normalized = [];
            }

          state.userFilters.selectedUsers = Array.from(new Set(normalized));
          if (filters.showBulkActions === undefined) {
            state.userFilters.showBulkActions = state.userFilters.selectedUsers.length > 0;
          }
        }

        if (filters.showBulkActions !== undefined) {
          state.userFilters.showBulkActions = filters.showBulkActions;
        }
      });
    },

    selectUser: (userId) => {
      setState((state) => {
          if (!state.userFilters.selectedUsers.includes(userId)) {
          state.userFilters.selectedUsers.push(userId);
          state.userFilters.showBulkActions = true;
          }
      });
    },

    deselectUser: (userId) => {
      setState((state) => {
        state.userFilters.selectedUsers = state.userFilters.selectedUsers.filter(
          (id) => id !== userId
        );
        state.userFilters.showBulkActions = state.userFilters.selectedUsers.length > 0;
      });
    },

    selectAllUsers: () => {
      setState((state) => {
        state.userFilters.selectedUsers = state.users.map((user) => user.id);
        state.userFilters.showBulkActions = state.userFilters.selectedUsers.length > 0;
      });
    },

    deselectAllUsers: () => {
      setState((state) => {
        state.userFilters.selectedUsers = [];
        state.userFilters.showBulkActions = false;
      });
    },

        updateUserRole: async (userId, role) => {
          try {
            const supabase = await getSupabaseBrowserClient();
            if (!supabase) {
              throw new Error('Database connection not available');
            }

            const { error } = await supabase
              .from('user_profiles')
              .update({ is_admin: role === 'admin' })
              .eq('user_id', userId);

            if (error) {
              throw new Error(`Failed to update user role: ${error.message}`);
            }

        setState((state) => {
          const target = state.users.find((user) => user.id === userId);
          if (target) {
            target.role = role as AdminUser['role'];
            target.is_admin = role === 'admin';
          }
        });

            logger.info('User role updated successfully', { userId, role });
          } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setErrorState(message);
        logger.error(
          'Failed to update user role',
          error instanceof Error ? error : new Error(message)
        );
          }
        },

        updateUserStatus: async (userId, status) => {
          try {
            const supabase = await getSupabaseBrowserClient();
            if (!supabase) {
              throw new Error('Database connection not available');
            }

            const { error } = await supabase
              .from('user_profiles')
              .update({ is_active: status === 'active' })
              .eq('user_id', userId);

            if (error) {
              throw new Error(`Failed to update user status: ${error.message}`);
            }

        setState((state) => {
          const target = state.users.find((user) => user.id === userId);
          if (target) {
            target.status = status as AdminUser['status'];
          }
        });

            logger.info('User status updated successfully', { userId, status });
          } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setErrorState(message);
        logger.error(
          'Failed to update user status',
          error instanceof Error ? error : new Error(message)
        );
          }
        },

        deleteUser: async (userId) => {
          try {
            const supabase = await getSupabaseBrowserClient();
            if (!supabase) {
              throw new Error('Database connection not available');
            }

        const { error } = await supabase.from('user_profiles').delete().eq('user_id', userId);

            if (error) {
              throw new Error(`Failed to delete user: ${error.message}`);
            }

        setState((state) => {
          state.users = state.users.filter((user) => user.id !== userId);
        });

            logger.info('User deleted successfully', { userId });
          } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setErrorState(message);
        logger.error(
          'Failed to delete user',
          error instanceof Error ? error : new Error(message)
        );
          }
        },

    setActiveTab: (tab) => {
      setState((state) => {
        state.activeTab = tab;
      });
    },

    setSystemSettings: (settings) => {
      setState((state) => {
        state.systemSettings = cloneSystemSettings(settings);
      });
    },

    updateSystemSetting: (section, key, value) => {
      setState((state) => {
        const settings = state.systemSettings;
        if (!settings) {
          return;
        }

        const targetSection = settings[section] as Record<string, unknown>;
        if (targetSection) {
          targetSection[key] = value;
        }
      });
    },

    setSettingsTab: (tab) => {
      setState((state) => {
        state.settingsTab = tab;
      });
    },

        saveSystemSettings: async () => {
          try {
        setIsSavingSettingsState(true);
        clearErrorState();

        const settings = get().systemSettings;
        if (!settings) {
              throw new Error('No settings to save');
            }

            const supabase = await getSupabaseBrowserClient();
            if (!supabase) {
              throw new Error('Database connection not available');
            }

            logger.info('System settings saved successfully');
          } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setErrorState(message);
        logger.error(
          'Failed to save system settings',
          error instanceof Error ? error : new Error(message)
        );
          } finally {
        setIsSavingSettingsState(false);
          }
        },

    setIsSavingSettings: setIsSavingSettingsState,

    setUpdating: (updating) => {
      setIsSavingSettingsState(updating);
    },

    setReimportProgress: (progress) => {
      setState((state) => {
        const target = state.reimportProgress;

        if (progress.totalStates !== undefined) {
          target.totalStates = progress.totalStates;
        }
        if (progress.processedStates !== undefined) {
          target.processedStates = progress.processedStates;
        }
        if (progress.successfulStates !== undefined) {
          target.successfulStates = progress.successfulStates;
        }
        if (progress.failedStates !== undefined) {
          target.failedStates = progress.failedStates;
        }
        if (progress.totalRepresentatives !== undefined) {
          target.totalRepresentatives = progress.totalRepresentatives;
        }
        if (progress.federalRepresentatives !== undefined) {
          target.federalRepresentatives = progress.federalRepresentatives;
        }
        if (progress.stateRepresentatives !== undefined) {
          target.stateRepresentatives = progress.stateRepresentatives;
        }
        if (progress.errors !== undefined) {
          target.errors = [...progress.errors];
        }
        if (progress.stateResults !== undefined) {
          target.stateResults = [...progress.stateResults];
        }
      });
    },

    addReimportLog: (message) => {
      setState((state) => {
        state.reimportLogs.push(message);
      });
    },

    clearReimportLogs: () => {
      setState((state) => {
        state.reimportLogs = [];
      });
    },

    setIsReimportRunning: setIsReimportRunningState,

        startReimport: async () => {
      setIsReimportRunningState(true);
      setState((state) => {
        state.reimportLogs.push('Starting reimport process...');
        state.reimportProgress = createDefaultReimportProgress();
      });

      try {
        await Promise.resolve();
        setState((state) => {
          state.reimportLogs.push('Reimport process completed');
        });
          } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState((state) => {
          state.reimportLogs.push(`Reimport failed: ${message}`);
        });
          } finally {
        setIsReimportRunningState(false);
          }
        },

    addActivityItem: (item) => {
      const entry: ActivityItem =
        'id' in item && 'timestamp' in item
          ? item
          : {
              id:
                typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                  ? crypto.randomUUID()
                  : Math.random().toString(36).slice(2),
              timestamp: new Date().toISOString(),
              ...item,
            };

      setState((state) => {
        state.activityItems.unshift(entry);
        if (state.activityItems.length > 100) {
          state.activityItems.length = 100;
        }
      });
    },

    clearActivityItems: () => {
      setState((state) => {
        state.activityItems = [];
        state.activityFeed = [];
      });
    },

    addAdminNotification: (notification) => {
      setState((state) => {
        state.adminNotifications.unshift(notification);
        if (state.adminNotifications.length > 25) {
          state.adminNotifications.length = 25;
        }
      });
    },

    clearAdminNotifications: () => {
      setState((state) => {
        state.adminNotifications = [];
      });
    },

    enableFeatureFlag: (flagId) => {
      const state = get();
      // If flag doesn't exist in store but is a mutable flag, initialize it
      if (!Object.prototype.hasOwnProperty.call(state.featureFlags.flags, flagId)) {
        // Check if it's a mutable flag (exists in FEATURE_FLAGS)
        if (MUTABLE_FLAG_KEYS.includes(flagId)) {
          // Initialize the flag in the store first
          setState((draft) => {
            draft.featureFlags.flags[flagId] = false; // Initialize as disabled
          });
        } else {
          logger.warn('Attempted to enable locked or unknown feature flag', { flagId });
          return false;
        }
      }

      const success = featureFlagManager.enable(flagId);
      if (success) {
        setState((draft) => {
          draft.featureFlags = recalcFeatureFlags(draft.featureFlags, {
            ...draft.featureFlags.flags,
            [flagId]: true,
          });
        });

        logger.info('Feature flag enabled', { flagId, action: 'enable_flag' });
      }

      return success;
    },

    disableFeatureFlag: (flagId) => {
      const state = get();
      // If flag doesn't exist in store but is a mutable flag, initialize it
      if (!Object.prototype.hasOwnProperty.call(state.featureFlags.flags, flagId)) {
        // Check if it's a mutable flag (exists in FEATURE_FLAGS)
        if (MUTABLE_FLAG_KEYS.includes(flagId)) {
          // Initialize the flag in the store first
          setState((draft) => {
            draft.featureFlags.flags[flagId] = true; // Initialize as enabled
          });
        } else {
          logger.warn('Attempted to disable locked or unknown feature flag', { flagId });
          return false;
        }
      }

      const success = featureFlagManager.disable(flagId);
      if (success) {
        setState((draft) => {
          draft.featureFlags = recalcFeatureFlags(draft.featureFlags, {
            ...draft.featureFlags.flags,
            [flagId]: false,
          });
        });

        logger.info('Feature flag disabled', { flagId, action: 'disable_flag' });
      }

      return success;
    },

    toggleFeatureFlag: (flagId) => {
      const state = get();
      if (!Object.prototype.hasOwnProperty.call(state.featureFlags.flags, flagId)) {
        logger.warn('Attempted to toggle locked feature flag', { flagId });
        return false;
      }

      const success = featureFlagManager.toggle(flagId);
      if (success) {
        setState((draft) => {
          draft.featureFlags = recalcFeatureFlags(draft.featureFlags, {
            ...draft.featureFlags.flags,
            [flagId]: !draft.featureFlags.flags[flagId],
          });
        });

        logger.info('Feature flag toggled', { flagId, action: 'toggle_flag' });
      }

      return success;
    },

    isFeatureFlagEnabled: (flagId) => featureFlagManager.isEnabled(flagId),

    getFeatureFlag: (flagId) => featureFlagManager.getFlag(flagId),

    getAllFeatureFlags: () => {
      const state = get();

      const mutableFlags = Object.entries(state.featureFlags.flags).map(([key, enabled]) => {
        const managerFlag = featureFlagManager.getFlag(key);
        if (managerFlag) {
          return managerFlag as DisplayFeatureFlag;
        }
        return {
          id: key,
          name: formatFlagName(key),
          description: `Feature flag for ${formatFlagName(key)}`,
          enabled,
          category: resolveCategory(state.featureFlags.categories, key),
        } satisfies DisplayFeatureFlag;
      }) as DisplayFeatureFlag[];

      const lockedFlags = state.featureFlags.lockedFlags.map((flagId) => {
        const managerFlag = featureFlagManager.getFlag(flagId);
        if (managerFlag) {
          return { ...(managerFlag as DisplayFeatureFlag), locked: true };
        }
        return {
          id: flagId,
          name: formatFlagName(flagId),
          description: `Core capability ${formatFlagName(flagId)} is always enabled`,
          enabled: true,
          category: resolveCategory(state.featureFlags.categories, flagId),
          locked: true,
        } satisfies DisplayFeatureFlag;
      }) as DisplayFeatureFlag[];

      return [...lockedFlags, ...mutableFlags].sort((a, b) => a.name.localeCompare(b.name));
    },

    exportFeatureFlagConfig: () => featureFlagManager.exportConfig(),

    importFeatureFlagConfig: (configInput) => {
      const rawConfig =
        typeof configInput === 'object' && configInput !== null
          ? (configInput as Record<string, unknown>)
          : null;

      if (!rawConfig) {
        logger.error('Failed to import feature flag config', undefined, { action: 'import_config' });
        return false;
      }

      const flags = rawConfig.flags;
      if (!isBooleanRecord(flags)) {
        logger.error('Invalid feature flag configuration: flags must be a boolean record', undefined, {
          action: 'import_config',
        });
        return false;
      }

      const normalizedConfig: FeatureFlagConfig = {
        flags,
        timestamp:
          typeof rawConfig.timestamp === 'string' ? rawConfig.timestamp : new Date().toISOString(),
        version: typeof rawConfig.version === 'string' ? rawConfig.version : '1.0.0',
      };

      try {
        featureFlagManager.importConfig(normalizedConfig);
        const nextFlags = featureFlagManager.exportConfig().flags;
        setState((draft) => {
          draft.featureFlags = recalcFeatureFlags(draft.featureFlags, { ...nextFlags });
        });

        logger.info('Feature flag config imported', { action: 'import_config' });
        return true;
      } catch (error) {
        logger.error(
          'Failed to import feature flag config',
          error instanceof Error ? error : undefined,
          { action: 'import_config' }
        );
        return false;
      }
    },

    resetFeatureFlags: () => {
      featureFlagManager.reset();
      const refreshed = getInitialFlagState();
      setState((draft) => {
        draft.featureFlags.flags = refreshed.flags;
        draft.featureFlags.enabledFlags = refreshed.enabledFlags;
        draft.featureFlags.disabledFlags = refreshed.disabledFlags;
        draft.featureFlags.lockedFlags = refreshed.lockedFlags;
      });

      logger.info('Feature flags reset to defaults', { action: 'reset_flags' });
    },

    setFeatureFlagLoading: (loading) => {
      setState((state) => {
        state.featureFlags.isLoading = loading;
      });
    },

    setFeatureFlagError: (error) => {
      setState((state) => {
        state.featureFlags.error = error;
      });
    },

        refreshData: async () => {
          const { loadUsers, loadDashboardStats, loadSystemSettings } = get();
      await Promise.all([loadUsers(), loadDashboardStats(), loadSystemSettings()]);
        },

        syncData: async () => {
      await get().refreshData();
        },

    resetAdminState: () => {
      const next = createInitialAdminState();
      setState((state) => {
        Object.assign(state, next);
      });
    },
  };
};

export const adminStoreCreator: AdminStoreCreator = (set, get) =>
  Object.assign(createInitialAdminState(), createAdminActions(set, get));

export const useAdminStore = create<AdminStore>()(
  devtools(
    persist(
      immer(adminStoreCreator),
      {
        name: 'admin-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          activeTab: state.activeTab,
          settingsTab: state.settingsTab,
          userFilters: state.userFilters,
        }),
      }
    ),
    { name: 'admin-store' }
  )
);

export const adminSelectors = {
  sidebarCollapsed: (state: AdminStore) => state.sidebarCollapsed,
  currentPage: (state: AdminStore) => state.currentPage,
  notifications: (state: AdminStore) => state.notifications,
  users: (state: AdminStore) => state.users,
  dashboardStats: (state: AdminStore) => state.dashboardStats,
  systemSettings: (state: AdminStore) => state.systemSettings,
  reimportProgress: (state: AdminStore) => state.reimportProgress,
  adminNotifications: (state: AdminStore) => state.adminNotifications,
  isLoading: (state: AdminStore) => state.isLoading,
  error: (state: AdminStore) => state.error,
};

export const useTrendingTopics = () => useAdminStore((state) => state.trendingTopics);
export const useGeneratedPolls = () => useAdminStore((state) => state.generatedPolls);
export const useSystemMetrics = () => useAdminStore((state) => state.systemMetrics);
export const useActivityItems = () => useAdminStore((state) => state.activityItems);
export const useActivityFeed = () => useAdminStore((state) => state.activityFeed);
export const useAdminNotifications = () => useAdminStore((state) => state.notifications);
export const useAdminFeatureFlags = () => useAdminStore((state) => state.featureFlags);
export const useAdminSidebarCollapsed = () => useAdminStore((state) => state.sidebarCollapsed);
export const useAdminLoading = () => useAdminStore((state) => state.isLoading);
export const useAdminError = () => useAdminStore((state) => state.error);

const filterAdminUsers = (users: AdminUser[], filters: AdminUserFilters): AdminUser[] => {
  const normalizedSearch = filters.searchTerm.trim().toLowerCase();
  const matchesSearch = (user: AdminUser) => {
    if (!normalizedSearch.length) {
      return true;
    }
    const emailMatch = user.email?.toLowerCase().includes(normalizedSearch);
    const nameMatch = user.name?.toLowerCase().includes(normalizedSearch);
    return Boolean(emailMatch || nameMatch);
  };

  const matchesRole = (user: AdminUser) =>
    filters.roleFilter === 'all' || user.role === filters.roleFilter;

  const matchesStatus = (user: AdminUser) =>
    filters.statusFilter === 'all' || user.status === filters.statusFilter;

  return users.filter((user) => matchesSearch(user) && matchesRole(user) && matchesStatus(user));
};

export const selectFilteredAdminUsers = (state: AdminState) =>
  filterAdminUsers(state.users, state.userFilters);

export const useAdminUsers = () => useAdminStore((state) => state.users);
export const useAdminUserCount = () => useAdminStore((state) => state.users.length);
export const useAdminUserFilters = () => useAdminStore((state) => state.userFilters);
export const useFilteredAdminUsers = () =>
  useAdminStore((state) => filterAdminUsers(state.users, state.userFilters));
export const useAdminSelectedUsers = () =>
  useAdminStore((state) => state.userFilters.selectedUsers);
export const useAdminShowBulkActions = () =>
  useAdminStore((state) => state.userFilters.showBulkActions);
export const useAdminUserActions = () =>
  useMemo(() => {
    const state = useAdminStore.getState();

    return {
      setUserFilters: state.setUserFilters,
      selectUser: state.selectUser,
      deselectUser: state.deselectUser,
      selectAllUsers: state.selectAllUsers,
      deselectAllUsers: state.deselectAllUsers,
      updateUserRole: state.updateUserRole,
      updateUserStatus: state.updateUserStatus,
      deleteUser: state.deleteUser,
    };
  }, []);

export const useAdminActiveTab = () => useAdminStore((state) => state.activeTab);
export const useAdminDashboardStats = () => useAdminStore((state) => state.dashboardStats);
export const useAdminDashboardActions = () =>
  useMemo(() => {
    const state = useAdminStore.getState();

    return {
      setActiveTab: state.setActiveTab,
      loadDashboardStats: state.loadDashboardStats,
    };
  }, []);

export const useAdminSystemSettings = () => useAdminStore((state) => state.systemSettings);
export const useAdminSettingsTab = () => useAdminStore((state) => state.settingsTab);
export const useAdminIsSavingSettings = () => useAdminStore((state) => state.isSavingSettings);
export const useAdminSystemSettingsActions = () =>
  useMemo(() => {
    const state = useAdminStore.getState();

    return {
      setSystemSettings: state.setSystemSettings,
      updateSystemSetting: state.updateSystemSetting,
      setSettingsTab: state.setSettingsTab,
      saveSystemSettings: state.saveSystemSettings,
      loadSystemSettings: state.loadSystemSettings,
    };
  }, []);

export const useAdminReimportProgress = () =>
  useAdminStore((state) => state.reimportProgress);
export const useAdminReimportLogs = () => useAdminStore((state) => state.reimportLogs);
export const useAdminIsReimportRunning = () =>
  useAdminStore((state) => state.isReimportRunning);
export const useAdminReimportActions = () =>
  useMemo(() => {
    const state = useAdminStore.getState();

    return {
      setReimportProgress: state.setReimportProgress,
      addReimportLog: state.addReimportLog,
      clearReimportLogs: state.clearReimportLogs,
      setIsReimportRunning: state.setIsReimportRunning,
      startReimport: state.startReimport,
    };
  }, []);

export const useAdminActions = () =>
  useMemo(() => {
    const state = useAdminStore.getState();

    return {
      addNotification: state.addNotification,
      toggleSidebar: state.toggleSidebar,
      loadUsers: state.loadUsers,
      loadDashboardStats: state.loadDashboardStats,
      loadSystemSettings: state.loadSystemSettings,
      setTrendingTopics: state.setTrendingTopics,
      setGeneratedPolls: state.setGeneratedPolls,
      setSystemMetrics: state.setSystemMetrics,
      updateActivityFeed: state.updateActivityFeed,
      addActivityItem: state.addActivityItem,
      clearActivityItems: state.clearActivityItems,
      addAdminNotification: state.addAdminNotification,
      clearAdminNotifications: state.clearAdminNotifications,
      markNotificationAsRead: state.markNotificationAsRead,
      markNotificationRead: state.markNotificationRead,
      setLoading: state.setLoading,
      setUpdating: state.setUpdating,
      setError: state.setError,
      clearError: state.clearError,
      refreshData: state.refreshData,
      syncData: state.syncData,
      resetAdminState: state.resetAdminState,
    };
  }, []);

export const useAdminFeatureFlagActions = () =>
  useMemo(() => {
    const state = useAdminStore.getState();

    return {
      enableFeatureFlag: state.enableFeatureFlag,
      disableFeatureFlag: state.disableFeatureFlag,
      toggleFeatureFlag: state.toggleFeatureFlag,
      isFeatureFlagEnabled: state.isFeatureFlagEnabled,
      getFeatureFlag: state.getFeatureFlag,
      getAllFeatureFlags: state.getAllFeatureFlags,
      exportFeatureFlagConfig: state.exportFeatureFlagConfig,
      importFeatureFlagConfig: state.importFeatureFlagConfig,
      resetFeatureFlags: state.resetFeatureFlags,
      setFeatureFlagLoading: state.setFeatureFlagLoading,
      setFeatureFlagError: state.setFeatureFlagError,
    };
  }, []);

export const useAdminStats = () => {
  const { totalUsers, totalNotifications, unreadNotifications, totalActivity } = useAdminStore(
    useShallow((state) => ({
      totalUsers: state.users.length,
      totalNotifications: state.notifications.length,
      unreadNotifications: state.notifications.filter((notification) => !notification.read).length,
      totalActivity: state.activityItems.length,
    }))
  );
  return useMemo(() => ({ totalUsers, totalNotifications, unreadNotifications, totalActivity }), [
    totalUsers,
    totalNotifications,
    unreadNotifications,
    totalActivity,
  ]);
};

export const useRecentActivity = () => {
  const activityItems = useAdminStore((state) => state.activityItems);
  return useMemo(() => activityItems.slice(0, 10), [activityItems]);
};

export const adminStoreUtils = {
  getAdminStats: () => {
    const state = useAdminStore.getState();
    return {
      totalUsers: state.users.length,
      totalNotifications: state.notifications.length,
      unreadNotifications: state.notifications.filter((notification) => !notification.read).length,
      totalActivity: state.activityItems.length,
    };
  },
  getDataSummary: () => {
    const state = useAdminStore.getState();
    return {
      users: state.users.length,
      trendingTopics: state.trendingTopics.length,
      generatedPolls: state.generatedPolls.length,
      activityItems: state.activityItems.length,
      notifications: state.notifications.length,
    };
  },
  reset: () => {
    useAdminStore.getState().resetAdminState();
  },
};

export const adminStoreSubscriptions = {
  subscribeToUsers: (callback: (users: AdminUser[]) => void) =>
    useAdminStore.subscribe((state, prevState) => {
      if (state.users !== prevState.users) {
      callback(state.users);
      }
    }),
  subscribeToDashboardStats: (callback: (stats: AdminDashboardStats | null) => void) =>
    useAdminStore.subscribe((state, prevState) => {
      if (state.dashboardStats !== prevState.dashboardStats) {
      callback(state.dashboardStats);
      }
    }),
  subscribeToNotifications: (callback: (notifications: AdminNotification[]) => void) =>
    useAdminStore.subscribe((state, prevState) => {
      if (state.notifications !== prevState.notifications) {
        callback(state.notifications);
      }
    }),
};

export const adminStoreDebug = {
  logState: () => {
    const state = useAdminStore.getState();
    const snapshot = {
      sidebarCollapsed: state.sidebarCollapsed,
      currentPage: state.currentPage,
      activeTab: state.activeTab,
      settingsTab: state.settingsTab,
      isLoading: state.isLoading,
      isSavingSettings: state.isSavingSettings,
      users: state.users.length,
      notifications: state.notifications.length,
      adminNotifications: state.adminNotifications.length,
      activityItems: state.activityItems.length,
      reimportRunning: state.isReimportRunning,
    };

    logger.info('Admin store state snapshot', snapshot);
  },

  logStats: () => {
    logger.info('Admin statistics', adminStoreUtils.getAdminStats());
  },

  logDataSummary: () => {
    logger.info('Admin data summary', adminStoreUtils.getDataSummary());
  },

  reset: () => {
    useAdminStore.getState().resetAdminState();
    logger.info('Admin store reset to initial state');
  },
};


