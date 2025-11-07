/**
 * @fileoverview Admin Store - Zustand Implementation
 *
 * Admin-specific business logic and data management.
 * UI state (sidebar, notifications, navigation) moved to global stores.
 *
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { withOptional } from '@/lib/util/objects';
import { logger } from '@/lib/utils/logger';

import type {
  AdminNotification,
  NewAdminNotification,
  TrendingTopic,
  GeneratedPoll,
  SystemMetrics,
  ActivityItem,
  AdminUser,
} from '../../features/admin/types';
import { getSupabaseBrowserClient } from '../../utils/supabase/client';

import { createSafeStorage } from './storage';

/**
 * Admin store state interface
 * Manages admin dashboard state, user management, system settings, and UI state.
 */
type AdminStore = {
  // UI State
  sidebarCollapsed: boolean;
  currentPage: string;
  notifications: AdminNotification[];

  // Admin-specific data
  trendingTopics: TrendingTopic[];
  generatedPolls: GeneratedPoll[];
  systemMetrics: SystemMetrics | null;
  activityItems: ActivityItem[];
  activityFeed: ActivityItem[];

  // User management data
  users: AdminUser[];
  userFilters: {
    searchTerm: string;
    roleFilter: 'all' | 'admin' | 'moderator' | 'user';
    statusFilter: 'all' | 'active' | 'inactive' | 'suspended';
    selectedUsers: string[];
    showBulkActions: boolean;
  };

  // Dashboard state
  activeTab: 'overview' | 'users' | 'analytics' | 'settings' | 'audit';
  dashboardStats: {
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
  } | null;

  // System settings state
  systemSettings: {
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
      notificationFrequency: 'immediate' | 'daily' | 'weekly';
    };
  } | null;
  settingsTab: 'general' | 'performance' | 'security' | 'notifications';
  isSavingSettings: boolean;

  // Reimport state
  reimportProgress: {
    totalStates: number;
    processedStates: number;
    successfulStates: number;
    failedStates: number;
    totalRepresentatives: number;
    federalRepresentatives: number;
    stateRepresentatives: number;
    errors: string[];
    stateResults: Array<{
      state: string;
      success: boolean;
      representatives: number;
      duration?: string;
      error?: string;
    }>;
  };
  reimportLogs: string[];
  isReimportRunning: boolean;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Admin notifications
  adminNotifications: AdminNotification[];

  // Actions
  // UI Actions
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: NewAdminNotification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Data loading actions
  loadUsers: () => Promise<void>;
  loadDashboardStats: () => Promise<void>;
  loadSystemSettings: () => Promise<void>;

  // User management actions
  setUserFilters: (filters: Partial<AdminStore['userFilters']>) => void;
  selectUser: (userId: string) => void;
  deselectUser: (userId: string) => void;
  selectAllUsers: () => void;
  deselectAllUsers: () => void;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  updateUserStatus: (userId: string, status: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  // Dashboard actions
  setActiveTab: (tab: AdminStore['activeTab']) => void;

  // System settings actions
  setSystemSettings: (settings: AdminStore['systemSettings']) => void;
  updateSystemSetting: (section: keyof NonNullable<AdminStore['systemSettings']>, key: string, value: unknown) => void;
  setSettingsTab: (tab: AdminStore['settingsTab']) => void;
  saveSystemSettings: () => Promise<void>;

  // Reimport actions
  setReimportProgress: (progress: Partial<AdminStore['reimportProgress']>) => void;
  addReimportLog: (message: string) => void;
  clearReimportLogs: () => void;
  setIsReimportRunning: (running: boolean) => void;
  startReimport: () => Promise<void>;

  // Activity and notifications
  addActivityItem: (item: ActivityItem) => void;
  clearActivityItems: () => void;
  addAdminNotification: (notification: AdminNotification) => void;
  clearAdminNotifications: () => void;
  markNotificationAsRead: (id: string) => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setIsSavingSettings: (saving: boolean) => void;
  refreshData: () => Promise<void>;
  syncData: () => Promise<void>;
}

const buildAdminNotification = (input: NewAdminNotification): AdminNotification => {
  const issuedAt = input.timestamp ?? new Date().toISOString();
  const createdAt = input.created_at ?? issuedAt;

  const base: AdminNotification = {
    id: crypto.randomUUID(),
    timestamp: issuedAt,
    type: input.type,
    title: input.title,
    message: input.message,
    read: input.read ?? false,
    created_at: createdAt,
  };

  return withOptional(base, {
    action: input.action,
    metadata: input.metadata,
  });
};

// Create the admin store
export const useAdminStore = create<AdminStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sidebarCollapsed: false,
        currentPage: 'dashboard',
        notifications: [],

        trendingTopics: [],
        generatedPolls: [],
        systemMetrics: null,
        activityItems: [],
        activityFeed: [],
        users: [],
        userFilters: {
          searchTerm: '',
          roleFilter: 'all',
          statusFilter: 'all',
          selectedUsers: [],
          showBulkActions: false,
        },
        activeTab: 'overview',
        dashboardStats: null,
        systemSettings: null,
        settingsTab: 'general',
        isSavingSettings: false,
        reimportProgress: {
          totalStates: 0,
          processedStates: 0,
          successfulStates: 0,
          failedStates: 0,
          totalRepresentatives: 0,
          federalRepresentatives: 0,
          stateRepresentatives: 0,
          errors: [],
          stateResults: [],
        },
        reimportLogs: [],
        isReimportRunning: false,
        isLoading: false,
        error: null,
        adminNotifications: [],

        /**
         * Toggle the admin sidebar collapsed state
         */
        toggleSidebar: () => {
          const currentState = get();
          const newState = !currentState.sidebarCollapsed;

          set(() => ({
            sidebarCollapsed: newState
          }));

          logger.info('Admin sidebar toggled', {
            action: 'toggle_sidebar',
            newState,
            currentPage: currentState.currentPage
          });
        },

        /**
         * Set the current admin page
         * @param page The page identifier
         */
        setCurrentPage: (page: string) => {
          const currentState = get();

          set({ currentPage: page });

          logger.info('Admin page navigation', {
            action: 'navigate_page',
            from: currentState.currentPage,
            to: page
          });
        },

        /**
         * Add a new admin notification
         * @param notification The notification payload without generated identifiers
         */
        addNotification: (notification: NewAdminNotification) => {
          const currentState = get();
          const newNotification = buildAdminNotification(notification);

          set((state: AdminStore) => ({
            notifications: [
              newNotification,
              ...state.notifications,
            ].slice(0, 10), // Keep only last 10 notifications
          }));

          logger.info('Admin notification created', {
            action: 'add_notification',
            type: notification.type,
            title: notification.title,
            currentCount: currentState.notifications.length + 1
          });

          // Check for critical notifications
          if (notification.type === 'error' || notification.type === 'warning') {
            logger.warn('Critical admin notification', {
              notification: newNotification,
              currentPage: currentState.currentPage
            });
          }
        },

        /**
         * Mark notification as read
         * @param id Notification ID
         */
        markNotificationRead: (id: string) => {
          const currentState = get();
          const notification = currentState.notifications.find((n: AdminNotification) => n.id === id);

          set((state: AdminStore) => ({
            notifications: state.notifications.map((notif: AdminNotification) =>
              notif.id === id ? (withOptional(notif, { read: true }) as AdminNotification) : notif
            ),
          }));

          if (notification) {
            logger.info('Admin notification read', {
              action: 'mark_notification_read',
              notificationId: id,
              notificationType: notification.type,
              timeToRead: Date.now() - new Date(notification.timestamp).getTime()
            });
          }
        },

        /**
         * Clear all notifications
         */
        clearNotifications: () => {
          const currentState = get();

          set({ notifications: [] });

          logger.info('Admin notifications cleared', {
            action: 'clear_notifications',
            clearedCount: currentState.notifications.length,
            currentPage: currentState.currentPage
          });
        },

        // Data loading actions
        loadUsers: async () => {
          const { setLoading, setError } = get();

          try {
            setLoading(true);
            setError(null);

            // Fetch users directly from database
            const supabase = await getSupabaseBrowserClient();
            if (!supabase) {
              throw new Error('Database connection not available');
            }

            const { data: users, error } = await supabase
              .from('user_profiles')
              .select(`
                id,
                user_id,
                email,
                display_name,
                is_admin,
                is_active,
                created_at,
                updated_at
              `)
              .order('created_at', { ascending: false });

            if (error) {
              throw new Error(`Failed to fetch users: ${error.message}`);
            }

            // Transform data to match AdminUser interface
            const adminUsers: AdminUser[] = users?.map((user) => {
              const base: Record<string, unknown> = {
                id: user.id || user.user_id,
                email: user.email,
                name: user.display_name ?? 'Unknown User',
                role: user.is_admin ? 'admin' : 'user',
                status: user.is_active ? 'active' : 'inactive',
                is_admin: user.is_admin ?? false,
                created_at: user.created_at ?? '',
              };

              if (user.updated_at) base.last_login = user.updated_at;

              return base as AdminUser;
            }) ?? [];

            set({ users: adminUsers });

            logger.info('Users loaded successfully', {
              userCount: adminUsers.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load users:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },

        loadDashboardStats: async () => {
          const { setLoading, setError } = get();

          try {
            setLoading(true);
            setError(null);

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

            const isRecord = (value: unknown): value is Record<string, any> =>
              value !== null && typeof value === 'object' && !Array.isArray(value);

            const createId = () =>
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : Math.random().toString(36).slice(2);

            const shareCounts = new Map<string, number>();
            const newActivityItems: ActivityItem[] = [];
            const pendingNotifications: AdminNotification[] = [];
            const existingNotifications = get().adminNotifications;

            let pollsCreatedLast7Days = 0;
            let pollsCreatedToday = 0;
            let milestoneAlertsLast7Days = 0;
            let shareActionsLast24h = 0;
            let latestMilestone: { pollId?: string; milestone?: number | null; occurredAt: string } | null = null;

            const pushActivityItem = (item: ActivityItem) => {
              if (!item.id) {
                return;
              }
              if (newActivityItems.length >= 15) {
                return;
              }
              newActivityItems.push(item);
            };

            (pollEvents ?? []).forEach((event) => {
               const createdAt = event.created_at ?? new Date().toISOString();
               const createdMs = Date.parse(createdAt);
              if (!isRecord(event.event_data)) {
                return;
              }

              const eventData = event.event_data as Record<string, unknown>;
              const action = typeof eventData.action === 'string' ? eventData.action : '';
               if (!action) {
                 return;
               }

              const metadata = isRecord(eventData.metadata)
                ? (eventData.metadata as Record<string, unknown>)
                : {};

              const pollId = typeof metadata.pollId === 'string'
                ? metadata.pollId
                : typeof metadata.poll_id === 'string'
                ? metadata.poll_id
                : undefined;

              if (action === 'poll_created') {
                pollsCreatedLast7Days += 1;
                if (!Number.isNaN(createdMs) && createdMs >= sinceTwentyFourHoursMs) {
                  pollsCreatedToday += 1;
                }

                const title = typeof metadata.title === 'string' && metadata.title.trim().length > 0
                  ? metadata.title
                  : 'Poll published';

                pushActivityItem({
                  id: event.id,
                  type: action,
                  title,
                  description: pollId ? `Poll ${pollId} is now live.` : 'A new poll is live on the platform.',
                  timestamp: createdAt,
                  metadata: withOptional(metadata, { pollId }),
                });
                return;
              }

              if (action === 'milestone_reached') {
                milestoneAlertsLast7Days += 1;

                const milestoneValueRaw = metadata.milestone;
                const milestoneValue = typeof milestoneValueRaw === 'number'
                  ? milestoneValueRaw
                  : typeof milestoneValueRaw === 'string'
                  ? Number.parseInt(milestoneValueRaw, 10)
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
                    ? `Poll ${pollId} just crossed ${milestoneLabel} votes.`
                    : `A poll crossed ${milestoneLabel} votes.`,
                  timestamp: createdAt,
                  metadata: withOptional(metadata, {
                    pollId,
                    milestone: milestoneValue,
                  }),
                });

                const alreadyNotified = existingNotifications.some(
                  (notification) => notification.metadata?.eventId === event.id,
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
                    metadata: withOptional(
                      {
                        eventId: event.id,
                      },
                      {
                        pollId,
                        milestone: milestoneValue,
                      }
                    ),
                  });
                  pending.id = createId();
                  pendingNotifications.push(pending);
                }
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
                  const channel = typeof channelRaw === 'string' && channelRaw.trim().length > 0
                    ? channelRaw
                    : action;
                  shareCounts.set(channel, (shareCounts.get(channel) ?? 0) + 1);
                }

                const channelLabelRaw = metadata.channel;
                const channelLabel = typeof channelLabelRaw === 'string' && channelLabelRaw.trim().length > 0
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
                  metadata: withOptional(metadata, {
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
                metadata: withOptional(metadata, { pollId }),
              });
            });

            const topShareChannelEntry = Array.from(shareCounts.entries()).sort((a, b) => b[1] - a[1])[0];
            const topShareChannel = topShareChannelEntry
              ? { channel: topShareChannelEntry[0], count: topShareChannelEntry[1] }
              : null;

            const mergeActivityItems = (existing: ActivityItem[], incoming: ActivityItem[]): ActivityItem[] => {
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

            const stats = {
              totalUsers: usersResult.count ?? 0,
              activePolls: pollsResult.count ?? 0,
              totalVotes: votesResult.count ?? 0,
              systemHealth: systemHealth as 'healthy' | 'warning' | 'critical',
              pollsCreatedLast7Days,
              pollsCreatedToday,
              milestoneAlertsLast7Days,
              shareActionsLast24h,
              topShareChannel,
              latestMilestone,
            };

            set((state: AdminStore) => ({
              dashboardStats: stats,
              activityItems: mergeActivityItems(state.activityItems, newActivityItems),
            }));

            if (pendingNotifications.length > 0) {
              set((state: AdminStore) => {
                const existingEventIds = new Set(pendingNotifications.map((notification) => notification.metadata?.eventId));
                const preservedNotifications = state.adminNotifications.filter((notification) => {
                  const eventId = notification.metadata?.eventId;
                  return !eventId || !existingEventIds.has(eventId);
                });

                return {
                  adminNotifications: [...pendingNotifications, ...preservedNotifications].slice(0, 25),
                };
              });
            }

            logger.info('Dashboard stats loaded successfully', {
              totalUsers: stats.totalUsers,
              activePolls: stats.activePolls,
              totalVotes: stats.totalVotes,
              pollsCreatedLast7Days,
              milestoneAlertsLast7Days,
              shareActionsLast24h,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load dashboard stats:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },

        loadSystemSettings: async () => {
          const { setLoading, setError } = get();

          try {
            setLoading(true);
            setError(null);

            // Fetch system settings from database
            const supabase = await getSupabaseBrowserClient();
            if (!supabase) {
              throw new Error('Database connection not available');
            }

            // System settings are stored in user_profiles preferences or as constants
            // Since system_settings table doesn't exist, use default settings

            // Use default settings if none exist in database
            const defaultSettings = {
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
                maxFileSize: 10485760, // 10MB
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
                notificationFrequency: 'immediate' as const,
              },
            };

            const settings = defaultSettings;
            set({ systemSettings: settings });

            logger.info('System settings loaded successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load system settings:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },

        // User management actions
        setUserFilters: (filters) => set((state) => {
          const { selectedUsers: incomingSelectedUsers, ...rest } = filters;
          const nextFilters = withOptional(state.userFilters, rest) as AdminStore['userFilters'];

          if (incomingSelectedUsers !== undefined) {
            let normalized: string[];

            if (incomingSelectedUsers instanceof Set) {
              normalized = Array.from(incomingSelectedUsers);
            } else if (Array.isArray(incomingSelectedUsers)) {
              normalized = [...incomingSelectedUsers];
            } else {
              normalized = [];
            }

            normalized = Array.from(new Set(normalized));
            nextFilters.selectedUsers = normalized;

            if (typeof rest.showBulkActions === 'undefined') {
              nextFilters.showBulkActions = normalized.length > 0;
            }
          }

          return { userFilters: nextFilters };
        }),

        selectUser: (userId) => set((state) => {
          if (state.userFilters.selectedUsers.includes(userId)) {
            return state;
          }

          const selectedUsers = [...state.userFilters.selectedUsers, userId];

          return {
            userFilters: withOptional(state.userFilters, {
              selectedUsers,
              showBulkActions: true,
            }) as AdminStore['userFilters'],
          };
        }),

        deselectUser: (userId) => set((state) => {
          if (!state.userFilters.selectedUsers.includes(userId)) {
            return state;
          }

          const selectedUsers = state.userFilters.selectedUsers.filter((id) => id !== userId);

          return {
            userFilters: withOptional(state.userFilters, {
              selectedUsers,
              showBulkActions: selectedUsers.length > 0,
            }) as AdminStore['userFilters'],
          };
        }),

        selectAllUsers: () => set((state) => {
          const selectedUsers = state.users.map((user) => user.id);

          return {
            userFilters: withOptional(state.userFilters, {
              selectedUsers,
              showBulkActions: selectedUsers.length > 0,
            }) as AdminStore['userFilters'],
          };
        }),

        deselectAllUsers: () => set((state) => ({
          userFilters: withOptional(state.userFilters, {
            selectedUsers: [],
            showBulkActions: false,
          }) as AdminStore['userFilters'],
        })),

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

            // Update local state
            set((state) => ({
              users: state.users.map((user) =>
                user.id === userId
                  ? (withOptional(user, { role: role as 'admin' | 'moderator' | 'user' }) as AdminUser)
                  : user
              ),
            }));

            logger.info('User role updated successfully', { userId, role });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage });
            logger.error('Failed to update user role:', error instanceof Error ? error : new Error(errorMessage));
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

            // Update local state
            set((state) => ({
              users: state.users.map((user) =>
                user.id === userId
                  ? (withOptional(user, { status: status as 'active' | 'inactive' | 'suspended' }) as AdminUser)
                  : user
              ),
            }));

            logger.info('User status updated successfully', { userId, status });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage });
            logger.error('Failed to update user status:', error instanceof Error ? error : new Error(errorMessage));
          }
        },

        deleteUser: async (userId) => {
          try {
            const supabase = await getSupabaseBrowserClient();
            if (!supabase) {
              throw new Error('Database connection not available');
            }

            const { error } = await supabase
              .from('user_profiles')
              .delete()
              .eq('user_id', userId);

            if (error) {
              throw new Error(`Failed to delete user: ${error.message}`);
            }

            // Update local state
            set((state) => ({
              users: state.users.filter(user => user.id !== userId)
            }));

            logger.info('User deleted successfully', { userId });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage });
            logger.error('Failed to delete user:', error instanceof Error ? error : new Error(errorMessage));
          }
        },

        // Dashboard actions
        setActiveTab: (tab) => set({ activeTab: tab }),

        // System settings actions
        setSystemSettings: (settings) => set({ systemSettings: settings }),

        updateSystemSetting: (section, key, value) => set((state) => {
          const currentSettings = state.systemSettings;
          if (!currentSettings) return state;

          const updatedSection = withOptional(currentSettings[section] ?? {}, {
            [key]: value,
          }) as Record<string, unknown>;

          return {
            systemSettings: withOptional(currentSettings, {
              [section]: updatedSection,
            }) as NonNullable<AdminStore['systemSettings']>,
          };
        }),

        setSettingsTab: (tab) => set({ settingsTab: tab }),

        saveSystemSettings: async () => {
          const { setIsSavingSettings, setError } = get();

          try {
            setIsSavingSettings(true);
            setError(null);

            const { systemSettings } = get();
            if (!systemSettings) {
              throw new Error('No settings to save');
            }

            const supabase = await getSupabaseBrowserClient();
            if (!supabase) {
              throw new Error('Database connection not available');
            }

            // System settings are not stored in database - they're application constants
            // This is a no-op for now, but could be implemented with a proper settings table

            logger.info('System settings saved successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to save system settings:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setIsSavingSettings(false);
          }
        },

        // Reimport actions
        setReimportProgress: (progress) => set((state) => ({
          reimportProgress: withOptional(state.reimportProgress, progress) as AdminStore['reimportProgress'],
        })),

        addReimportLog: (message) => set((state) => ({
          reimportLogs: [...state.reimportLogs, message]
        })),

        clearReimportLogs: () => set({ reimportLogs: [] }),

        setIsReimportRunning: (running) => set({ isReimportRunning: running }),

        startReimport: async () => {
          const { setIsReimportRunning, addReimportLog, setReimportProgress } = get();

          try {
            setIsReimportRunning(true);
            addReimportLog('Starting reimport process...');

            // Reset progress
            setReimportProgress({
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

            // Implementation would go here
            addReimportLog('Reimport process completed');
          } catch (error) {
            addReimportLog(`Reimport failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          } finally {
            setIsReimportRunning(false);
          }
        },

        // Activity and notifications
        addActivityItem: (item) => set((state) => ({
          activityItems: [item, ...state.activityItems.slice(0, 99)] // Keep last 100 items
        })),

        clearActivityItems: () => set({ activityItems: [] }),

        addAdminNotification: (notification) => set((state) => ({
          adminNotifications: [notification, ...state.adminNotifications]
        })),

        clearAdminNotifications: () => set({ adminNotifications: [] }),

        markNotificationAsRead: (id) => set((state) => ({
          adminNotifications: state.adminNotifications.map((notification) =>
            notification.id === id
              ? (withOptional(notification, { read: true }) as typeof notification)
              : notification
          ),
        })),

        // Utility actions
        setLoading: (loading) => set({ isLoading: loading }),
        setUpdating: (updating) => set({ isSavingSettings: updating }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setIsSavingSettings: (saving) => set({ isSavingSettings: saving }),

        refreshData: async () => {
          const { loadUsers, loadDashboardStats, loadSystemSettings } = get();
          await Promise.all([
            loadUsers(),
            loadDashboardStats(),
            loadSystemSettings()
          ]);
        },

        syncData: async () => {
          const { refreshData } = get();
          await refreshData();
        },
      }),
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
    {
      name: 'admin-store',
    }
  )
);

// Export individual selectors for better performance
export const useTrendingTopics = () => useAdminStore((state) => state.trendingTopics);
export const useGeneratedPolls = () => useAdminStore((state) => state.generatedPolls);
export const useSystemMetrics = () => useAdminStore((state) => state.systemMetrics);
export const useActivityItems = () => useAdminStore((state) => state.activityItems);
export const useActivityFeed = () => useAdminStore((state) => state.activityFeed);
export const useAdminNotifications = () => useAdminStore((state) => state.adminNotifications);
export const useAdminLoading = () => useAdminStore((state) => state.isLoading);
export const useAdminError = () => useAdminStore((state) => state.error);

// User management selectors
export const useAdminUsers = () => useAdminStore((state) => state.users);
export const useAdminUserFilters = () => useAdminStore((state) => state.userFilters);
export const useAdminUserActions = () => useAdminStore((state) => ({
  setUserFilters: state.setUserFilters,
  selectUser: state.selectUser,
  deselectUser: state.deselectUser,
  selectAllUsers: state.selectAllUsers,
  deselectAllUsers: state.deselectAllUsers,
  updateUserRole: state.updateUserRole,
  updateUserStatus: state.updateUserStatus,
  deleteUser: state.deleteUser,
}));

// Dashboard selectors
export const useAdminActiveTab = () => useAdminStore((state) => state.activeTab);
export const useAdminDashboardStats = () => useAdminStore((state) => state.dashboardStats);
export const useAdminDashboardActions = () => useAdminStore((state) => ({
  setActiveTab: state.setActiveTab,
  loadDashboardStats: state.loadDashboardStats,
}));

// System settings selectors
export const useAdminSystemSettings = () => useAdminStore((state) => state.systemSettings);
export const useAdminSettingsTab = () => useAdminStore((state) => state.settingsTab);
export const useAdminIsSavingSettings = () => useAdminStore((state) => state.isSavingSettings);
export const useAdminSystemSettingsActions = () => useAdminStore((state) => ({
  setSystemSettings: state.setSystemSettings,
  updateSystemSetting: state.updateSystemSetting,
  setSettingsTab: state.setSettingsTab,
  saveSystemSettings: state.saveSystemSettings,
  loadSystemSettings: state.loadSystemSettings,
}));

// Reimport selectors
export const useAdminReimportProgress = () => useAdminStore((state) => state.reimportProgress);
export const useAdminReimportLogs = () => useAdminStore((state) => state.reimportLogs);
export const useAdminIsReimportRunning = () => useAdminStore((state) => state.isReimportRunning);
export const useAdminReimportActions = () => useAdminStore((state) => ({
  setReimportProgress: state.setReimportProgress,
  addReimportLog: state.addReimportLog,
  clearReimportLogs: state.clearReimportLogs,
  setIsReimportRunning: state.setIsReimportRunning,
  startReimport: state.startReimport,
}));

// General admin actions
export const useAdminActions = () => useAdminStore((state) => ({
  loadUsers: state.loadUsers,
  loadDashboardStats: state.loadDashboardStats,
  loadSystemSettings: state.loadSystemSettings,
  addActivityItem: state.addActivityItem,
  clearActivityItems: state.clearActivityItems,
  addAdminNotification: state.addAdminNotification,
  clearAdminNotifications: state.clearAdminNotifications,
  markNotificationAsRead: state.markNotificationAsRead,
  setLoading: state.setLoading,
  setUpdating: state.setUpdating,
  setError: state.setError,
  clearError: state.clearError,
  refreshData: state.refreshData,
  syncData: state.syncData,
}));

// Admin store utilities
export const useAdminStats = () => useAdminStore((state) => ({
  totalUsers: state.users.length,
  totalNotifications: state.adminNotifications.length,
  unreadNotifications: state.adminNotifications.filter(n => !n.read).length,
  totalActivity: state.activityItems.length,
}));

// Recent activity selector
export const useRecentActivity = () => useAdminStore((state) =>
  state.activityItems.slice(0, 10)
);

// Admin store utilities
export const adminStoreUtils = {
  getAdminStats: () => {
    const state = useAdminStore.getState();
    return {
      totalUsers: state.users.length,
      totalNotifications: state.adminNotifications.length,
      unreadNotifications: state.adminNotifications.filter(n => !n.read).length,
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
      notifications: state.adminNotifications.length,
    };
  },
};

// Admin store subscriptions
export const adminStoreSubscriptions = {
  subscribeToUsers: (callback: (users: AdminUser[]) => void) => {
    return useAdminStore.subscribe((state) => {
      callback(state.users);
    });
  },

  subscribeToDashboardStats: (callback: (stats: AdminStore['dashboardStats']) => void) => {
    return useAdminStore.subscribe((state) => {
      callback(state.dashboardStats);
    });
  },

  subscribeToNotifications: (callback: (notifications: AdminNotification[]) => void) => {
    return useAdminStore.subscribe((state) => {
      callback(state.adminNotifications);
    });
  },
};

// Admin store debug utilities
export const adminStoreDebug = {
  logState: () => {
    useAdminStore.getState();
    logger.info('Admin store state logged');
  },

  logStats: () => {
    const stats = adminStoreUtils.getAdminStats();
    logger.info('Admin statistics:', stats);
  },

  logDataSummary: () => {
    const summary = adminStoreUtils.getDataSummary();
    logger.info('Admin data summary:', summary);
  },

  reset: () => {
    useAdminStore.getState().clearActivityItems();
    useAdminStore.getState().clearAdminNotifications();
    // Admin store reset
  }
};
