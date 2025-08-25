import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  trend_score: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  source: string;
}

export interface GeneratedPoll {
  id: string;
  title: string;
  options: string[];
  source_topic_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  metrics?: {
    total_votes: number;
    engagement_rate: number;
  };
}

export interface SystemMetrics {
  total_topics: number;
  total_polls: number;
  active_polls: number;
  system_health: 'healthy' | 'warning' | 'error';
  last_updated: string;
}

export interface ActivityItem {
  id: string;
  type: 'topic_created' | 'topic_updated' | 'poll_created' | 'poll_updated' | 'poll_generated' | 'poll_approved' | 'system_alert';
  title: string;
  description: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error';
  metadata?: {
    topicId?: string;
    pollId?: string;
    updates?: Partial<TrendingTopic> | Partial<GeneratedPoll>;
  };
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface AdminStore {
  // UI State
  sidebarCollapsed: boolean;
  currentPage: string;
  notifications: Notification[];
  
  // Data State
  trendingTopics: TrendingTopic[];
  generatedPolls: GeneratedPoll[];
  systemMetrics: SystemMetrics;
  activityFeed: ActivityItem[];
  
  // Loading States
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
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setCurrentPage: (page: string) => set({ currentPage: page }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            read: false,
          },
          ...state.notifications,
        ].slice(0, 10), // Keep only last 10 notifications
      })),
      
      markNotificationRead: (id: string) => set((state) => ({
        notifications: state.notifications.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        ),
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      // Data Actions
      updateTrendingTopics: (topics: TrendingTopic[]) => set({ trendingTopics: topics }),
      
      updateGeneratedPolls: (polls: GeneratedPoll[]) => set({ generatedPolls: polls }),
      
      updateSystemMetrics: (metrics: SystemMetrics) => set({ systemMetrics: metrics }),
      
      updateActivityFeed: (activities: ActivityItem[]) => set({ activityFeed: activities }),
      
      // Loading Actions
      setLoading: (key: keyof AdminStore['isLoading'], loading: boolean) => set((state) => ({
        isLoading: { ...state.isLoading, [key]: loading },
      })),
      
      // Real-time Actions
      addTopic: (topic: TrendingTopic) => set((state) => ({
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
      })),
      
      updateTopic: (id: string, updates: Partial<TrendingTopic>) => set((state) => ({
        trendingTopics: state.trendingTopics.map(topic =>
          topic.id === id ? { ...topic, ...updates } : topic
        ),
        activityFeed: [
          {
            id: crypto.randomUUID(),
            type: 'topic_updated' as const,
            title: 'Trending Topic Updated',
            description: `Topic "${updates.title || 'Unknown'}" was updated`,
            timestamp: new Date().toISOString(),
            metadata: { topicId: id, updates }
          },
          ...state.activityFeed
        ].slice(0, 50)
      })),
      
      addPoll: (poll: GeneratedPoll) => set((state) => ({
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
      })),
      
      updatePoll: (id: string, updates: Partial<GeneratedPoll>) => set((state) => ({
        generatedPolls: state.generatedPolls.map(poll =>
          poll.id === id ? { ...poll, ...updates } : poll
        ),
        activityFeed: [
          {
            id: crypto.randomUUID(),
            type: 'poll_updated' as const,
            title: 'Generated Poll Updated',
            description: `Poll "${updates.title || 'Unknown'}" was updated`,
            timestamp: new Date().toISOString(),
            metadata: { pollId: id, updates }
          },
          ...state.activityFeed
        ].slice(0, 50)
      })),
      
      addActivity: (activity: ActivityItem) => set((state) => ({
        activityFeed: [activity, ...state.activityFeed].slice(0, 50)
      }))
    }),
    {
      name: 'admin-store',
    }
  )
);
