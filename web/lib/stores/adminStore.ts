/**
 * Admin Store - Zustand Implementation
 * 
 * Admin-specific business logic and data management.
 * UI state (sidebar, notifications, navigation) moved to global stores.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/utils/logger';
import { withOptional } from '@/lib/utils/objects';
import type {
  AdminNotification,
  TrendingTopic,
  GeneratedPoll,
  SystemMetrics,
  ActivityItem,
} from '@/features/admin/types';

// Admin store state interface (business logic only)
type AdminStore = {
  // Admin-specific data
  trendingTopics: TrendingTopic[];
  generatedPolls: GeneratedPoll[];
  systemMetrics: SystemMetrics | null;
  activityItems: ActivityItem[];
  activityFeed: ActivityItem[];
  
  // Admin notifications (business logic)
  adminNotifications: AdminNotification[];
  
  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Actions - Data management
  setTrendingTopics: (topics: TrendingTopic[]) => void;
  addTrendingTopic: (topic: Omit<TrendingTopic, 'id' | 'created_at'>) => void;
  updateTrendingTopic: (id: string, updates: Partial<TrendingTopic>) => void;
  removeTrendingTopic: (id: string) => void;
  
  setGeneratedPolls: (polls: GeneratedPoll[]) => void;
  addGeneratedPoll: (poll: Omit<GeneratedPoll, 'id' | 'created_at'>) => void;
  updateGeneratedPoll: (id: string, updates: Partial<GeneratedPoll>) => void;
  removeGeneratedPoll: (id: string) => void;
  
  setSystemMetrics: (metrics: SystemMetrics) => void;
  updateSystemMetrics: (updates: Partial<SystemMetrics>) => void;
  
  addActivityItem: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  setActivityFeed: (activities: ActivityItem[]) => void;
  clearActivityItems: () => void;
  
  // Actions - Admin notifications
  addAdminNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp'>) => void;
  markAdminNotificationRead: (id: string) => void;
  clearAdminNotifications: () => void;
  
  // Actions - Loading states
  setLoading: (loading: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Actions - Data operations
  refreshData: () => Promise<void>;
  syncData: () => Promise<void>;
}

// Create admin store with middleware
export const useAdminStore = create<AdminStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        trendingTopics: [],
        generatedPolls: [],
        systemMetrics: null,
        activityItems: [],
        activityFeed: [],
        adminNotifications: [],
        isLoading: false,
        isUpdating: false,
        error: null,
        
        // Data management actions
        setTrendingTopics: (topics) => set({ trendingTopics: topics }),
        
        addTrendingTopic: (topic) => set((state) => ({
          trendingTopics: [
            ...state.trendingTopics,
            withOptional(topic, {
              id: `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              created_at: new Date().toISOString(),
            }) as TrendingTopic
          ]
        })),
        
        updateTrendingTopic: (id, updates) => set((state) => ({
          trendingTopics: state.trendingTopics.map(topic =>
            topic.id === id ? withOptional(topic, updates) : topic
          )
        })),
        
        removeTrendingTopic: (id) => set((state) => ({
          trendingTopics: state.trendingTopics.filter(topic => topic.id !== id)
        })),
        
        setGeneratedPolls: (polls) => set({ generatedPolls: polls }),
        
        addGeneratedPoll: (poll) => set((state) => ({
          generatedPolls: [
            ...state.generatedPolls,
            withOptional(poll, {
              id: `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              created_at: new Date().toISOString(),
            }) as GeneratedPoll
          ]
        })),
        
        updateGeneratedPoll: (id, updates) => set((state) => ({
          generatedPolls: state.generatedPolls.map(poll =>
            poll.id === id ? withOptional(poll, updates) : poll
          )
        })),
        
        removeGeneratedPoll: (id) => set((state) => ({
          generatedPolls: state.generatedPolls.filter(poll => poll.id !== id)
        })),
        
        setSystemMetrics: (metrics) => set({ systemMetrics: metrics }),
        
        updateSystemMetrics: (updates) => set((state) => ({
          systemMetrics: state.systemMetrics ? withOptional(state.systemMetrics, updates) : null
        })),
        
        addActivityItem: (item) => set((state) => ({
          activityItems: [
            ...state.activityItems,
            withOptional(item, {
              id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date().toISOString(),
            }) as ActivityItem
          ]
        })),
        
        setActivityFeed: (activities) => set({ activityFeed: activities }),
        
        clearActivityItems: () => set({ activityItems: [], activityFeed: [] }),
        
        // Admin notification actions
        addAdminNotification: (notification) => set((state) => ({
          adminNotifications: [
            ...state.adminNotifications,
            withOptional(notification, {
              id: `admin_notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date().toISOString(),
            }) as AdminNotification
          ]
        })),
        
        markAdminNotificationRead: (id) => set((state) => ({
          adminNotifications: state.adminNotifications.map(notification =>
            notification.id === id ? withOptional(notification, { read: true }) : notification
          )
        })),
        
        clearAdminNotifications: () => set({ adminNotifications: [] }),
        
        // Loading state actions
        setLoading: (loading) => set({ isLoading: loading }),
        setUpdating: (updating) => set({ isUpdating: updating }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        
        // Data operations
        refreshData: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            // Fetch fresh data from API
            const [topicsResponse, pollsResponse, metricsResponse] = await Promise.all([
              fetch('/api/admin/trending-topics'),
              fetch('/api/admin/generated-polls'),
              fetch('/api/admin/system-metrics'),
            ]);
            
            if (!topicsResponse.ok || !pollsResponse.ok || !metricsResponse.ok) {
              throw new Error('Failed to fetch admin data');
            }
            
            const [topics, polls, metrics] = await Promise.all([
              topicsResponse.json(),
              pollsResponse.json(),
              metricsResponse.json(),
            ]);
            
            set({ trendingTopics: topics, generatedPolls: polls, systemMetrics: metrics });
            
            logger.info('Admin data refreshed successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to refresh admin data:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        syncData: async () => {
          const { setUpdating, setError } = get();
          
          try {
            setUpdating(true);
            setError(null);
            
            // Sync data with server
            const response = await fetch('/api/admin/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            
            if (!response.ok) {
              throw new Error('Failed to sync admin data');
            }
            
            logger.info('Admin data synced successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to sync admin data:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setUpdating(false);
          }
        },
      }),
      {
        name: 'admin-store',
        partialize: (state) => ({
          trendingTopics: state.trendingTopics,
          generatedPolls: state.generatedPolls,
          systemMetrics: state.systemMetrics,
          activityItems: state.activityItems,
          activityFeed: state.activityFeed,
        }),
      }
    ),
    { name: 'admin-store' }
  )
);

// Store selectors for optimized re-renders
export const useTrendingTopics = () => useAdminStore(state => state.trendingTopics);
export const useGeneratedPolls = () => useAdminStore(state => state.generatedPolls);
export const useSystemMetrics = () => useAdminStore(state => state.systemMetrics);
export const useActivityItems = () => useAdminStore(state => state.activityItems);
export const useActivityFeed = () => useAdminStore(state => state.activityFeed);
export const useAdminNotifications = () => useAdminStore(state => state.adminNotifications);
export const useAdminLoading = () => useAdminStore(state => state.isLoading);
export const useAdminError = () => useAdminStore(state => state.error);

// Action selectors
export const useAdminActions = () => useAdminStore(state => ({
  setTrendingTopics: state.setTrendingTopics,
  addTrendingTopic: state.addTrendingTopic,
  updateTrendingTopic: state.updateTrendingTopic,
  removeTrendingTopic: state.removeTrendingTopic,
  setGeneratedPolls: state.setGeneratedPolls,
  addGeneratedPoll: state.addGeneratedPoll,
  updateGeneratedPoll: state.updateGeneratedPoll,
  removeGeneratedPoll: state.removeGeneratedPoll,
  setSystemMetrics: state.setSystemMetrics,
  updateSystemMetrics: state.updateSystemMetrics,
  addActivityItem: state.addActivityItem,
  setActivityFeed: state.setActivityFeed,
  clearActivityItems: state.clearActivityItems,
  addAdminNotification: state.addAdminNotification,
  markAdminNotificationRead: state.markAdminNotificationRead,
  clearAdminNotifications: state.clearAdminNotifications,
  setLoading: state.setLoading,
  setUpdating: state.setUpdating,
  setError: state.setError,
  clearError: state.clearError,
  refreshData: state.refreshData,
  syncData: state.syncData,
}));

// Computed selectors
export const useAdminStats = () => useAdminStore(state => ({
  totalTopics: state.trendingTopics.length,
  totalPolls: state.generatedPolls.length,
  totalActivities: state.activityItems.length,
  unreadNotifications: state.adminNotifications.filter(n => !n.read).length,
  systemHealth: state.systemMetrics?.system_health || 'unknown',
}));

export const useRecentActivity = () => useAdminStore(state => 
  state.activityItems
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
);

// Store utilities
export const adminStoreUtils = {
  /**
   * Get admin dashboard data
   */
  getDashboardData: () => {
    const state = useAdminStore.getState();
    return {
      topics: state.trendingTopics,
      polls: state.generatedPolls,
      metrics: state.systemMetrics,
      activities: state.activityItems,
      notifications: state.adminNotifications,
    };
  },
  
  /**
   * Get admin statistics
   */
  getAdminStats: () => {
    const state = useAdminStore.getState();
    return {
      totalTopics: state.trendingTopics.length,
      totalPolls: state.generatedPolls.length,
      totalActivities: state.activityItems.length,
      unreadNotifications: state.adminNotifications.filter(n => !n.read).length,
      systemHealth: state.systemMetrics?.system_health || 'unknown',
      lastUpdated: state.systemMetrics?.last_updated || null,
    };
  },
  
  /**
   * Check if admin data is stale
   */
  isDataStale: (maxAge: number = 5 * 60 * 1000) => { // 5 minutes default
    const state = useAdminStore.getState();
    if (!state.systemMetrics?.last_updated) return true;
    
    const lastUpdated = new Date(state.systemMetrics.last_updated).getTime();
    const now = Date.now();
    return (now - lastUpdated) > maxAge;
  },
  
  /**
   * Get admin data summary
   */
  getDataSummary: () => {
    const state = useAdminStore.getState();
    return {
      topics: {
        total: state.trendingTopics.length,
        recent: state.trendingTopics.filter(topic => {
          const created = new Date(topic.created_at).getTime();
          const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
          return created > dayAgo;
        }).length,
      },
      polls: {
        total: state.generatedPolls.length,
        active: state.generatedPolls.filter(poll => poll.status === 'active').length,
      },
      activities: {
        total: state.activityItems.length,
        recent: state.activityItems.filter(activity => {
          const timestamp = new Date(activity.timestamp).getTime();
          const hourAgo = Date.now() - (60 * 60 * 1000);
          return timestamp > hourAgo;
        }).length,
      },
    };
  }
};

// Store subscriptions for external integrations
export const adminStoreSubscriptions = {
  /**
   * Subscribe to trending topics changes
   */
  onTrendingTopicsChange: (callback: (topics: TrendingTopic[]) => void) => {
    let prevTopics: TrendingTopic[] | null = null;
    return useAdminStore.subscribe(
      (state) => {
        const topics = state.trendingTopics;
        if (topics !== prevTopics) {
          callback(topics);
        }
        prevTopics = topics;
        return topics;
      }
    );
  },
  
  /**
   * Subscribe to system metrics changes
   */
  onSystemMetricsChange: (callback: (metrics: SystemMetrics | null) => void) => {
    let prevMetrics: SystemMetrics | null = null;
    return useAdminStore.subscribe(
      (state) => {
        const metrics = state.systemMetrics;
        if (metrics !== prevMetrics) {
          callback(metrics);
        }
        prevMetrics = metrics;
        return metrics;
      }
    );
  },
  
  /**
   * Subscribe to activity feed changes
   */
  onActivityFeedChange: (callback: (activities: ActivityItem[]) => void) => {
    let prevActivities: ActivityItem[] | null = null;
    return useAdminStore.subscribe(
      (state) => {
        const activities = state.activityFeed;
        if (activities !== prevActivities) {
          callback(activities);
        }
        prevActivities = activities;
        return activities;
      }
    );
  }
};

// Store debugging utilities
export const adminStoreDebug = {
  /**
   * Log current admin state
   */
  logState: () => {
    const state = useAdminStore.getState();
    console.log('Admin Store State:', {
      topics: state.trendingTopics.length,
      polls: state.generatedPolls.length,
      metrics: state.systemMetrics ? 'loaded' : 'null',
      activities: state.activityItems.length,
      notifications: state.adminNotifications.length,
      isLoading: state.isLoading,
      error: state.error
    });
  },
  
  /**
   * Log admin statistics
   */
  logStats: () => {
    const stats = adminStoreUtils.getAdminStats();
    console.log('Admin Statistics:', stats);
  },
  
  /**
   * Log data summary
   */
  logDataSummary: () => {
    const summary = adminStoreUtils.getDataSummary();
    console.log('Admin Data Summary:', summary);
  },
  
  /**
   * Reset admin store
   */
  reset: () => {
    useAdminStore.getState().clearActivityItems();
    useAdminStore.getState().clearAdminNotifications();
    console.log('Admin store reset');
  }
};
