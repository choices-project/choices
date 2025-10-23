import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { FEATURE_FLAGS, featureFlagManager } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';


import type {
  AdminNotification,
  TrendingTopic,
  GeneratedPoll,
  SystemMetrics,
  ActivityItem,
  AdminStore,
  FeatureFlagConfig
} from '../types';

// Store implementation
export const useAdminStore = create<AdminStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      sidebarCollapsed: false,
      currentPage: 'dashboard',
      notifications: [],
      
      trendingTopics: [],
      generatedPolls: [],
      systemMetrics: {
        total_topics: 0,
        total_polls: 0,
        active_polls: 0,
        system_health: 'healthy',
        last_updated: new Date().toISOString(),
      },
      activityItems: [],
      activityFeed: [],
      
      // Feature Flag State
      featureFlags: {
        flags: { ...FEATURE_FLAGS },
        enabledFlags: Object.keys(FEATURE_FLAGS).filter(key => FEATURE_FLAGS[key as keyof typeof FEATURE_FLAGS]),
        disabledFlags: Object.keys(FEATURE_FLAGS).filter(key => !FEATURE_FLAGS[key as keyof typeof FEATURE_FLAGS]),
        categories: {
          core: ['WEBAUTHN', 'PWA', 'ADMIN', 'FEEDBACK_WIDGET'],
          enhanced: ['ENHANCED_PROFILE', 'ENHANCED_POLLS', 'ENHANCED_VOTING'],
          civics: ['CIVICS_ADDRESS_LOOKUP', 'CIVICS_REPRESENTATIVE_DATABASE', 'CIVICS_CAMPAIGN_FINANCE'],
          future: ['AUTOMATED_POLLS', 'DEMOGRAPHIC_FILTERING'],
          performance: ['PERFORMANCE_OPTIMIZATION', 'FEATURE_DB_OPTIMIZATION_SUITE']
        },
        isLoading: false,
        error: null
      },
      
      // UI Actions
      /**
       * Toggle the admin sidebar collapsed state
       */
      toggleSidebar: () => {
        const currentState = get();
        const newState = !currentState.sidebarCollapsed;
        
        set(() => ({ 
          sidebarCollapsed: newState 
        }));
        
        // Log sidebar toggle for UX analytics
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
        
        // Log page navigation for analytics
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
      addNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp'>) => {
        const currentState = get();
        const newNotification: AdminNotification = Object.assign({}, notification, {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        });
        
        set((state: AdminStore) => ({
          notifications: [
            newNotification,
            ...state.notifications,
          ].slice(0, 10), // Keep only last 10 notifications
        }));
        
        // Log notification creation for monitoring
        logger.info('Admin notification created', { 
          action: 'add_notification', 
          type: notification.type,
          title: notification.title,
          currentCount: currentState.notifications.length + 1
        });
        
        // Check for critical notifications and trigger alerts
        if (notification.type === 'error' || notification.type === 'warning') {
          logger.warn('Critical admin notification', { 
            notification: newNotification,
            currentPage: currentState.currentPage 
          });
        }
      },
      
      markNotificationRead: (id: string) => {
        const currentState = get();
        const notification = currentState.notifications.find((n: AdminNotification) => n.id === id);
        
        set((state: AdminStore) => ({
          notifications: state.notifications.map((notif: AdminNotification) =>
            notif.id === id ? Object.assign({}, notif, { read: true }) : notif
          ),
        }));
        
        // Log notification read for engagement analytics
        if (notification) {
          logger.info('Admin notification read', { 
            action: 'mark_notification_read', 
            notificationId: id,
            notificationType: notification.type,
            timeToRead: Date.now() - new Date(notification.timestamp).getTime()
          });
        }
      },
      
      clearNotifications: () => {
        const currentState = get();
        
        set({ notifications: [] });
        
        // Log notification clearing for analytics
        logger.info('Admin notifications cleared', { 
          action: 'clear_notifications', 
          clearedCount: currentState.notifications.length,
          currentPage: currentState.currentPage 
        });
      },
      
      setTrendingTopics: (topics: TrendingTopic[]) => {
        set({ trendingTopics: topics });
        
        // Log topics update for monitoring
        const uniqueCategories = Array.from(new Set(topics.map(t => t.category)));
        logger.info('Trending topics updated', { 
          action: 'update_trending_topics', 
          count: topics.length,
          categories: uniqueCategories,
          averageScore: topics.reduce((sum, t) => sum + t.trending_score, 0) / topics.length
        });
        
        // Check for significant changes
        const significantChanges = topics.filter(t => t.trending_score > 0.8);
        if (significantChanges.length > 0) {
          logger.info('High-trending topics detected', { 
            highTrendingTopics: significantChanges.map(t => ({ id: t.id, title: t.title, score: t.trending_score }))
          });
        }
      },
      
      setGeneratedPolls: (polls: GeneratedPoll[]) => {
        set({ generatedPolls: polls });
        
        // Log polls update for monitoring
        const statusBreakdown = polls.reduce((acc, poll) => {
          acc[poll.status] = (acc[poll.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const uniqueCategories = Array.from(new Set(polls.map(p => p.category)));
        logger.info('Generated polls updated', { 
          action: 'update_generated_polls', 
          count: polls.length,
          statusBreakdown,
          categories: uniqueCategories
        });
        
        // Check for polls needing attention
        const draftPolls = polls.filter(p => p.status === 'draft');
        if (draftPolls.length > 5) {
          logger.warn('High number of draft polls', { 
            draftCount: draftPolls.length,
            draftPolls: draftPolls.map(p => ({ id: p.id, title: p.title }))
          });
        }
      },
      
      setSystemMetrics: (metrics: SystemMetrics) => {
        const currentState = get();
        const previousHealth = currentState.systemMetrics?.system_health;
        
        set({ systemMetrics: metrics });
        
        // Log metrics update for monitoring
        logger.info('System metrics updated', { 
          action: 'update_system_metrics', 
          totalTopics: metrics.total_topics,
          totalPolls: metrics.total_polls,
          activePolls: metrics.active_polls,
          systemHealth: metrics.system_health,
          performanceMetrics: metrics.performance_metrics
        });
        
        // Check for health status changes
        if (previousHealth && previousHealth !== metrics.system_health) {
          logger.warn('System health status changed', { 
            previousHealth,
            newHealth: metrics.system_health,
            timestamp: metrics.last_updated
          });
        }
        
        // Check for performance issues
        if (metrics.performance_metrics) {
          const { response_time_avg, error_rate } = metrics.performance_metrics;
          if (response_time_avg > 1000) {
            logger.warn('High response time detected', { responseTime: response_time_avg });
          }
          if (error_rate > 0.05) {
            logger.warn('High error rate detected', { errorRate: error_rate });
          }
        }
      },
      
      addActivityItem: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => {
        const currentState = get();
        const newActivity: ActivityItem = Object.assign({}, item, {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        });
        
        set((state: AdminStore) => ({
          activityItems: [newActivity, ...state.activityItems].slice(0, 50)
        }));
        
        // Log activity addition for monitoring
        logger.info('Activity added to feed', { 
          action: 'add_activity', 
          activityId: newActivity.id,
          type: newActivity.type,
          title: newActivity.title,
          currentActivitiesCount: currentState.activityItems.length + 1
        });
        
        // Check for system alerts
        if (newActivity.type === 'system_alert') {
          logger.warn('System alert in activity feed', { 
            activity: newActivity,
            requiresAttention: true
          });
        }
      },
      
      clearActivityItems: () => {
        const currentState = get();
        
        set({ activityItems: [] });
        
        // Log activity clearing for analytics
        logger.info('Activity feed cleared', { 
          action: 'clear_activities', 
          clearedCount: currentState.activityItems.length,
          currentPage: currentState.currentPage 
        });
      },
      
      // Legacy methods for backward compatibility
      updateTrendingTopics: (topics: TrendingTopic[]) => {
        set({ trendingTopics: topics });
      },
      
      updateGeneratedPolls: (polls: GeneratedPoll[]) => {
        set({ generatedPolls: polls });
      },
      
      updateSystemMetrics: (metrics: SystemMetrics) => {
        set({ systemMetrics: metrics });
      },
      
      updateActivityFeed: (activities: ActivityItem[]) => {
        set({ activityFeed: activities });
      },
      
      setLoading: (key: string, loading: boolean) => {
        // Legacy method - no longer used but kept for compatibility
        logger.info('Legacy setLoading called', { key, loading });
      },
      
      // Feature Flag Actions
      enableFeatureFlag: (flagId: string) => {
        const success = featureFlagManager.enable(flagId);
        if (success) {
          set((state) => {
            const newFlags = { ...state.featureFlags.flags, [flagId]: true };
            const enabledFlags = Object.keys(newFlags).filter(key => newFlags[key]);
            const disabledFlags = Object.keys(newFlags).filter(key => !newFlags[key]);
            
            return {
              featureFlags: {
                ...state.featureFlags,
                flags: newFlags,
                enabledFlags,
                disabledFlags
              }
            };
          });
          
          logger.info('Feature flag enabled', { flagId, action: 'enable_flag' });
        }
        return success;
      },
      
      disableFeatureFlag: (flagId: string) => {
        const success = featureFlagManager.disable(flagId);
        if (success) {
          set((state) => {
            const newFlags = { ...state.featureFlags.flags, [flagId]: false };
            const enabledFlags = Object.keys(newFlags).filter(key => newFlags[key]);
            const disabledFlags = Object.keys(newFlags).filter(key => !newFlags[key]);
            
            return {
              featureFlags: {
                ...state.featureFlags,
                flags: newFlags,
                enabledFlags,
                disabledFlags
              }
            };
          });
          
          logger.info('Feature flag disabled', { flagId, action: 'disable_flag' });
        }
        return success;
      },
      
      toggleFeatureFlag: (flagId: string) => {
        const success = featureFlagManager.toggle(flagId);
        if (success) {
          set((state) => {
            const newFlags = { ...state.featureFlags.flags, [flagId]: !state.featureFlags.flags[flagId] };
            const enabledFlags = Object.keys(newFlags).filter(key => newFlags[key]);
            const disabledFlags = Object.keys(newFlags).filter(key => !newFlags[key]);
            
            return {
              featureFlags: {
                ...state.featureFlags,
                flags: newFlags,
                enabledFlags,
                disabledFlags
              }
            };
          });
          
          logger.info('Feature flag toggled', { flagId, action: 'toggle_flag' });
        }
        return success;
      },
      
      isFeatureFlagEnabled: (flagId: string) => {
        return featureFlagManager.isEnabled(flagId);
      },
      
      getFeatureFlag: (flagId: string) => {
        return featureFlagManager.getFlag(flagId);
      },
      
      getAllFeatureFlags: () => {
        const state = get();
        return Object.entries(state.featureFlags.flags).map(([key, enabled]) => ({
          id: key,
          name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          enabled,
          description: `Feature flag for ${key.toLowerCase().replace(/_/g, ' ')}`,
          key,
          category: state.featureFlags.categories.core?.includes(key) ? 'core' :
                   state.featureFlags.categories.enhanced?.includes(key) ? 'enhanced' :
                   state.featureFlags.categories.civics?.includes(key) ? 'civics' :
                   state.featureFlags.categories.future?.includes(key) ? 'future' :
                   state.featureFlags.categories.performance?.includes(key) ? 'performance' : 'general'
        }));
      },
      
      exportFeatureFlagConfig: () => {
        return featureFlagManager.exportConfig();
      },
      
      importFeatureFlagConfig: (config: FeatureFlagConfig) => {
        try {
          featureFlagManager.importConfig(config);
          set((state) => ({
            featureFlags: {
              ...state.featureFlags,
              flags: { ...config.flags },
              enabledFlags: Object.keys(config.flags).filter(key => config.flags[key]),
              disabledFlags: Object.keys(config.flags).filter(key => !config.flags[key])
            }
          }));
          
          logger.info('Feature flag config imported', { config, action: 'import_config' });
          return true;
        } catch (error) {
          logger.error('Failed to import feature flag config', error instanceof Error ? error : undefined, { action: 'import_config' });
          return false;
        }
      },
      
      resetFeatureFlags: () => {
        featureFlagManager.reset();
        set((state) => ({
          featureFlags: {
            ...state.featureFlags,
            flags: { ...FEATURE_FLAGS },
            enabledFlags: Object.keys(FEATURE_FLAGS).filter(key => FEATURE_FLAGS[key as keyof typeof FEATURE_FLAGS]),
            disabledFlags: Object.keys(FEATURE_FLAGS).filter(key => !FEATURE_FLAGS[key as keyof typeof FEATURE_FLAGS])
          }
        }));
        
        logger.info('Feature flags reset to defaults', { action: 'reset_flags' });
      },
      
      setFeatureFlagLoading: (loading: boolean) => {
        set((state) => ({
          featureFlags: { ...state.featureFlags, isLoading: loading }
        }));
      },
      
      setFeatureFlagError: (error: string | null) => {
        set((state) => ({
          featureFlags: { ...state.featureFlags, error }
        }));
      }
    }),
    {
      name: 'admin-store',
    }
  )
);