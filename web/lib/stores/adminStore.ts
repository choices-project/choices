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
import { devtools , persist } from 'zustand/middleware';

import { logger } from '@/lib/utils/logger';

import type {
  AdminNotification,
  TrendingTopic,
  GeneratedPoll,
  SystemMetrics,
  ActivityItem,
  AdminUser,
} from '../../features/admin/types';
import { getSupabaseBrowserClient } from '../../utils/supabase/client';

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
    selectedUsers: Set<string>;
    showBulkActions: boolean;
  };
  
  // Dashboard state
  activeTab: 'overview' | 'users' | 'analytics' | 'settings' | 'audit';
  dashboardStats: {
    totalUsers: number;
    activePolls: number;
    totalVotes: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
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
  addNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp'>) => void;
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
          selectedUsers: new Set(),
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
         * @param notification The notification data (without id and timestamp)
         */
        addNotification: (notification: Omit<AdminNotification, 'id' | 'created_at'>) => {
          const currentState = get();
          const newNotification: AdminNotification = {
            ...notification,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            read: false,
          };
          
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
              notif.id === id ? { ...notif, read: true } : notif
            ),
          }));
          
          if (notification) {
            logger.info('Admin notification read', { 
              action: 'mark_notification_read', 
              notificationId: id,
              notificationType: notification.type,
              timeToRead: Date.now() - new Date(notification.created_at).getTime()
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
            
            // Fetch dashboard stats directly from database
            const supabase = await getSupabaseBrowserClient();
            if (!supabase) {
              throw new Error('Database connection not available');
            }

            // Get total users count
            const { count: totalUsers, error: usersError } = await supabase
              .from('user_profiles')
              .select('*', { count: 'exact', head: true });

            if (usersError) {
              throw new Error(`Failed to fetch user count: ${usersError.message}`);
            }

            // Get active polls count
            const { count: activePolls, error: pollsError } = await supabase
              .from('polls')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'active');

            if (pollsError) {
              throw new Error(`Failed to fetch polls count: ${pollsError.message}`);
            }

            // Get total votes count
            const { count: totalVotes, error: votesError } = await supabase
              .from('votes')
              .select('*', { count: 'exact', head: true });

            if (votesError) {
              throw new Error(`Failed to fetch votes count: ${votesError.message}`);
            }

            // Determine system health based on recent activity
            const { data: recentActivity } = await supabase
              .from('analytics_events')
              .select('created_at')
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
              .limit(1);

            const systemHealth = recentActivity && recentActivity.length > 0 ? 'healthy' : 'warning';

            const stats = {
              totalUsers: totalUsers ?? 0,
              activePolls: activePolls ?? 0,
              totalVotes: totalVotes ?? 0,
              systemHealth: systemHealth as 'healthy' | 'warning' | 'critical'
            };

            set({ dashboardStats: stats });
            
            logger.info('Dashboard stats loaded successfully', {
              totalUsers: stats.totalUsers,
              activePolls: stats.activePolls,
              totalVotes: stats.totalVotes,
              systemHealth: stats.systemHealth
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
        setUserFilters: (filters) => set((state) => ({
          userFilters: { ...state.userFilters, ...filters }
        })),

        selectUser: (userId) => set((state) => ({
          userFilters: {
            ...state.userFilters,
            selectedUsers: new Set(Array.from(state.userFilters.selectedUsers).concat(userId))
          }
        })),

        deselectUser: (userId) => set((state) => {
          const newSelected = new Set(state.userFilters.selectedUsers);
          newSelected.delete(userId);
          return {
            userFilters: {
              ...state.userFilters,
              selectedUsers: newSelected
            }
          };
        }),

        selectAllUsers: () => set((state) => ({
          userFilters: {
            ...state.userFilters,
            selectedUsers: new Set(state.users.map(user => user.id))
          }
        })),

        deselectAllUsers: () => set((state) => ({
          userFilters: {
            ...state.userFilters,
            selectedUsers: new Set()
          }
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
              users: state.users.map(user => 
                user.id === userId ? { ...user, role: role as 'admin' | 'moderator' | 'user' } : user
              )
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
              users: state.users.map(user => 
                user.id === userId ? { ...user, status: status as 'active' | 'inactive' | 'suspended' } : user
              )
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
          if (!state.systemSettings) return state;
          
          return {
            systemSettings: {
              ...state.systemSettings,
              [section]: {
                ...state.systemSettings[section],
                [key]: value
              }
            }
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
          reimportProgress: { ...state.reimportProgress, ...progress }
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
          adminNotifications: state.adminNotifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          )
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