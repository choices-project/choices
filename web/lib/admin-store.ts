import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { logger } from './logger';

// Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

export interface TrendingTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  trending_score: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface GeneratedPoll {
  id: string;
  title: string;
  description: string;
  options: string[];
  category: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  total_topics: number;
  total_polls: number;
  active_polls: number;
  system_health: 'healthy' | 'warning' | 'critical';
  last_updated: string;
  performance_metrics?: {
    response_time_avg: number;
    error_rate: number;
    active_users: number;
  };
}

export interface ActivityItem {
  id: string;
  type: 'topic_created' | 'topic_updated' | 'poll_created' | 'poll_updated' | 'system_alert' | 'user_action';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface AdminStore {
  // State
  sidebarCollapsed: boolean;
  currentPage: string;
  notifications: Notification[];
  
  trendingTopics: TrendingTopic[];
  generatedPolls: GeneratedPoll[];
  systemMetrics: SystemMetrics;
  activityFeed: ActivityItem[];
  
  isLoading: {
    topics: boolean;
    polls: boolean;
    metrics: boolean;
  };
  
  // Actions
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Data Actions
  updateTrendingTopics: (topics: TrendingTopic[]) => void;
  updateGeneratedPolls: (polls: GeneratedPoll[]) => void;
  updateSystemMetrics: (metrics: SystemMetrics) => void;
  updateActivityFeed: (activities: ActivityItem[]) => void;
  
  // Loading Actions
  setLoading: (key: keyof AdminStore['isLoading'], loading: boolean) => void;
  
  // Real-time Actions
  addTopic: (topic: TrendingTopic) => void;
  updateTopic: (id: string, updates: Partial<TrendingTopic>) => void;
  addPoll: (poll: GeneratedPoll) => void;
  updatePoll: (id: string, updates: Partial<GeneratedPoll>) => void;
  addActivity: (activity: ActivityItem) => void;
}

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
      activityFeed: [],
      
      isLoading: {
        topics: false,
        polls: false,
        metrics: false,
      },
      
      // UI Actions
      toggleSidebar: () => {
        const currentState = get();
        const newState = !currentState.sidebarCollapsed;
        
        set((state) => ({ 
          sidebarCollapsed: newState 
        }));
        
        // Log sidebar toggle for UX analytics
        logger.info('Admin sidebar toggled', { 
          action: 'toggle_sidebar', 
          newState,
          currentPage: currentState.currentPage 
        });
      },
      
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
      
      addNotification: (notification) => {
        const currentState = get();
        const newNotification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false,
        };
        
        set((state) => ({
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
        const notification = currentState.notifications.find(n => n.id === id);
        
        set((state) => ({
          notifications: state.notifications.map(notif =>
            notif.id === id ? { ...notif, read: true } : notif
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
      
      // Data Actions
      updateTrendingTopics: (topics: TrendingTopic[]) => {
        const currentState = get();
        
        set({ trendingTopics: topics });
        
        // Log topics update for monitoring
        logger.info('Trending topics updated', { 
          action: 'update_trending_topics', 
          count: topics.length,
          categories: [...new Set(topics.map(t => t.category))],
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
      
      updateGeneratedPolls: (polls: GeneratedPoll[]) => {
        const currentState = get();
        
        set({ generatedPolls: polls });
        
        // Log polls update for monitoring
        const statusBreakdown = polls.reduce((acc, poll) => {
          acc[poll.status] = (acc[poll.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        logger.info('Generated polls updated', { 
          action: 'update_generated_polls', 
          count: polls.length,
          statusBreakdown,
          categories: [...new Set(polls.map(p => p.category))]
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
      
      updateSystemMetrics: (metrics: SystemMetrics) => {
        const currentState = get();
        const previousHealth = currentState.systemMetrics.system_health;
        
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
        if (previousHealth !== metrics.system_health) {
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
      
      updateActivityFeed: (activities: ActivityItem[]) => {
        set({ activityFeed: activities });
        
        // Log activity feed update for monitoring
        const typeBreakdown = activities.reduce((acc, activity) => {
          acc[activity.type] = (acc[activity.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        logger.info('Activity feed updated', { 
          action: 'update_activity_feed', 
          count: activities.length,
          typeBreakdown
        });
      },
      
      // Loading Actions
      setLoading: (key: keyof AdminStore['isLoading'], loading: boolean) => {
        const currentState = get();
        
        set((state) => ({
          isLoading: { ...state.isLoading, [key]: loading },
        }));
        
        // Log loading state changes for performance monitoring
        logger.info('Loading state changed', { 
          action: 'set_loading', 
          key,
          loading,
          currentPage: currentState.currentPage,
          duration: loading ? 'started' : 'completed'
        });
      },
      
      // Real-time Actions
      addTopic: (topic: TrendingTopic) => {
        const currentState = get();
        
        set((state) => ({
          trendingTopics: [topic, ...state.trendingTopics],
          activityFeed: [
            {
              id: crypto.randomUUID(),
              type: 'topic_created' as const,
              title: 'New Trending Topic',
              description: `Topic "${topic.title}" was created`,
              timestamp: new Date().toISOString(),
              metadata: { topicId: topic.id }
            },
            ...state.activityFeed
          ].slice(0, 50) // Keep only last 50 activities
        }));
        
        // Log topic creation for analytics
        logger.info('Trending topic created', { 
          action: 'add_topic', 
          topicId: topic.id,
          title: topic.title,
          category: topic.category,
          trendingScore: topic.trending_score,
          currentTopicsCount: currentState.trendingTopics.length + 1
        });
        
        // Check for high-trending topics
        if (topic.trending_score > 0.9) {
          logger.info('High-trending topic created', { 
            topic,
            requiresAttention: true
          });
        }
      },
      
      updateTopic: (id: string, updates: Partial<TrendingTopic>) => {
        const currentState = get();
        const existingTopic = currentState.trendingTopics.find(t => t.id === id);
        
        set((state) => ({
          trendingTopics: state.trendingTopics.map(topic =>
            topic.id === id ? { ...topic, ...updates } : topic
          ),
          activityFeed: [
            {
              id: crypto.randomUUID(),
              type: 'topic_updated' as const,
              title: 'Trending Topic Updated',
              description: `Topic "${updates.title || existingTopic?.title || 'Unknown'}" was updated`,
              timestamp: new Date().toISOString(),
              metadata: { topicId: id, updates }
            },
            ...state.activityFeed
          ].slice(0, 50)
        }));
        
        // Log topic update for analytics
        logger.info('Trending topic updated', { 
          action: 'update_topic', 
          topicId: id,
          updates,
          previousTitle: existingTopic?.title,
          newTitle: updates.title
        });
        
        // Check for significant changes
        if (updates.trending_score && existingTopic && Math.abs(updates.trending_score - existingTopic.trending_score) > 0.2) {
          logger.info('Significant trending score change', { 
            topicId: id,
            previousScore: existingTopic.trending_score,
            newScore: updates.trending_score,
            change: updates.trending_score - existingTopic.trending_score
          });
        }
      },
      
      addPoll: (poll: GeneratedPoll) => {
        const currentState = get();
        
        set((state) => ({
          generatedPolls: [poll, ...state.generatedPolls],
          activityFeed: [
            {
              id: crypto.randomUUID(),
              type: 'poll_created' as const,
              title: 'New Generated Poll',
              description: `Poll "${poll.title}" was created`,
              timestamp: new Date().toISOString(),
              metadata: { pollId: poll.id }
            },
            ...state.activityFeed
          ].slice(0, 50)
        }));
        
        // Log poll creation for analytics
        logger.info('Generated poll created', { 
          action: 'add_poll', 
          pollId: poll.id,
          title: poll.title,
          category: poll.category,
          status: poll.status,
          optionsCount: poll.options.length,
          currentPollsCount: currentState.generatedPolls.length + 1
        });
        
        // Check for polls that need review
        if (poll.status === 'draft') {
          logger.info('Draft poll created - requires review', { 
            poll,
            requiresAttention: true
          });
        }
      },
      
      updatePoll: (id: string, updates: Partial<GeneratedPoll>) => {
        const currentState = get();
        const existingPoll = currentState.generatedPolls.find(p => p.id === id);
        
        set((state) => ({
          generatedPolls: state.generatedPolls.map(poll =>
            poll.id === id ? { ...poll, ...updates } : poll
          ),
          activityFeed: [
            {
              id: crypto.randomUUID(),
              type: 'poll_updated' as const,
              title: 'Generated Poll Updated',
              description: `Poll "${updates.title || existingPoll?.title || 'Unknown'}" was updated`,
              timestamp: new Date().toISOString(),
              metadata: { pollId: id, updates }
            },
            ...state.activityFeed
          ].slice(0, 50)
        }));
        
        // Log poll update for analytics
        logger.info('Generated poll updated', { 
          action: 'update_poll', 
          pollId: id,
          updates,
          previousStatus: existingPoll?.status,
          newStatus: updates.status
        });
        
        // Check for status changes
        if (updates.status && existingPoll && updates.status !== existingPoll.status) {
          logger.info('Poll status changed', { 
            pollId: id,
            previousStatus: existingPoll.status,
            newStatus: updates.status,
            title: existingPoll.title
          });
        }
      },
      
      addActivity: (activity: ActivityItem) => {
        const currentState = get();
        
        set((state) => ({
          activityFeed: [activity, ...state.activityFeed].slice(0, 50)
        }));
        
        // Log activity addition for monitoring
        logger.info('Activity added to feed', { 
          action: 'add_activity', 
          activityId: activity.id,
          type: activity.type,
          title: activity.title,
          currentActivitiesCount: currentState.activityFeed.length + 1
        });
        
        // Check for system alerts
        if (activity.type === 'system_alert') {
          logger.warn('System alert in activity feed', { 
            activity,
            requiresAttention: true
          });
        }
      }
    }),
    {
      name: 'admin-store',
    }
  )
);
