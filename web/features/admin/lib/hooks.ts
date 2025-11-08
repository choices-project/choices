import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { logger, devLog } from '@/lib/utils/logger';

import type {
  TrendingTopic,
  GeneratedPoll,
  SystemMetrics,
  BreakingNewsStory,
  PollContext,
  AdminRealtimeEvent,
  FeedbackRealtimeEvent,
} from '../types';

import { realTimeService } from './real-time-service';
import { useAdminStore } from './store';

/**
 * Fallback values returned when admin APIs are unavailable.
 * Empty arrays/objects instead of mock data to avoid misleading users.
 */
const emptyTrendingTopics: TrendingTopic[] = [];
const emptyGeneratedPolls: GeneratedPoll[] = [];
const emptySystemMetrics: SystemMetrics = {
  total_topics: 0,
  total_polls: 0,
  active_polls: 0,
  system_health: 'warning',
  last_updated: new Date().toISOString()
};

/**
 * Fetches trending topics for admin review.
 * Returns empty array on error instead of throwing.
 *
 * @returns Trending topics or empty array if API fails
 */
const fetchTrendingTopics = async (): Promise<TrendingTopic[]> => {
  try {
    const response = await fetch('/api/admin/trending-topics');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    devLog('Fetched trending topics from API', { count: data.topics?.length || 0 });
    return data.topics || emptyTrendingTopics;
  } catch (error) {
    devLog('Error fetching trending topics - API unavailable', { error });
    logger.warn('⚠️ Admin API: Trending topics endpoint failed. Showing empty state.');
    return emptyTrendingTopics;
  }
};

/**
 * Fetches AI-generated polls awaiting admin approval.
 * Returns empty array on error instead of throwing.
 *
 * @returns Generated polls or empty array if API fails
 */
const fetchGeneratedPolls = async (): Promise<GeneratedPoll[]> => {
  try {
    const response = await fetch('/api/admin/generated-polls');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    devLog('Fetched generated polls from API', { count: data.polls?.length || 0 });
    return data.polls || emptyGeneratedPolls;
  } catch (error) {
    devLog('Error fetching generated polls - API unavailable', { error });
    logger.warn('⚠️ Admin API: Generated polls endpoint failed. Showing empty state.');
    return emptyGeneratedPolls;
  }
};

/**
 * Fetches system health metrics (topic counts, poll counts, health status).
 * Returns empty metrics object on error instead of throwing.
 *
 * @returns System metrics or empty object if API fails
 */
const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    const response = await fetch('/api/admin/health?type=metrics');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    devLog('Fetched system metrics from API', { metrics: data.metrics });
    return data.metrics || emptySystemMetrics;
  } catch (error) {
    devLog('Error fetching system metrics - API unavailable', { error });
    logger.warn('⚠️ Admin API: System metrics endpoint failed. Showing empty state.');
    return emptySystemMetrics;
  }
};

const approveTopic = async (topicId: string): Promise<void> => {
  const response = await fetch(`/api/admin/trending-topics/${topicId}/approve`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

const rejectTopic = async (topicId: string): Promise<void> => {
  const response = await fetch(`/api/admin/trending-topics/${topicId}/reject`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

const approvePoll = async (pollId: string): Promise<void> => {
  const response = await fetch(`/api/admin/generated-polls/${pollId}/approve`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

const rejectPoll = async (pollId: string): Promise<void> => {
  const response = await fetch(`/api/admin/generated-polls/${pollId}/reject`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

const analyzeTrendingTopics = async (): Promise<void> => {
  const response = await fetch('/api/admin/trending-topics/analyze', {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

// Breaking News API functions
const fetchBreakingNews = async (): Promise<BreakingNewsStory[]> => {
  try {
    const response = await fetch('/api/admin/breaking-news');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    devLog('Fetched breaking news from API', { count: data.stories?.length || 0 });
    return data.stories || [];
  } catch (error) {
    devLog('Error fetching breaking news, using empty array', { error });
    return [];
  }
};

const createBreakingNews = async (story: Omit<BreakingNewsStory, 'id' | 'createdAt' | 'updatedAt'>): Promise<BreakingNewsStory> => {
  const response = await fetch('/api/admin/breaking-news', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(story),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.story;
};

const generatePollContext = async (storyId: string): Promise<PollContext> => {
  const response = await fetch(`/api/admin/breaking-news/${storyId}/poll-context`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.pollContext;
};

// Custom hooks
export const useTrendingTopics = () => {
  const queryClient = useQueryClient();
  const { updateTrendingTopics, setLoading, updateActivityFeed } = useAdminStore();

  const query = useQuery({
    queryKey: ['trending-topics'],
    queryFn: fetchTrendingTopics,
    refetchInterval: 30000, // 30 seconds
  });

  React.useEffect(() => {
    if (query.data) {
      updateTrendingTopics(query.data);
      setLoading('topics', false);

      // Warn if we got empty data (API likely failed)
      if (query.data === emptyTrendingTopics || query.data.length === 0) {
        logger.warn('⚠️ Admin Dashboard: No trending topics data available. Check API endpoints.');
      }

      // Invalidate related queries when trending topics update
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    }
    if (query.error) {
      setLoading('topics', false);
    }
  }, [query.data, query.error, updateTrendingTopics, setLoading, updateActivityFeed, queryClient]);

  return query;
};

export const useGeneratedPolls = () => {
  const queryClient = useQueryClient();
  const { updateGeneratedPolls, setLoading } = useAdminStore();

  const query = useQuery({
    queryKey: ['generated-polls'],
    queryFn: fetchGeneratedPolls,
    refetchInterval: 30000, // 30 seconds
  });

  React.useEffect(() => {
    if (query.data) {
      updateGeneratedPolls(query.data);
      setLoading('polls', false);

      // Invalidate related queries when generated polls update
      queryClient.invalidateQueries({ queryKey: ['system-metrics'] });
    }
    if (query.error) {
      setLoading('polls', false);
    }
  }, [query.data, query.error, updateGeneratedPolls, setLoading, queryClient]);

  return query;
};

export const useSystemMetrics = () => {
  const { updateSystemMetrics, setLoading } = useAdminStore();

  const query = useQuery({
    queryKey: ['system-metrics'],
    queryFn: fetchSystemMetrics,
    refetchInterval: 60000, // 1 minute
  });

  React.useEffect(() => {
    if (query.data) {
      updateSystemMetrics(query.data);
      setLoading('metrics', false);
    }
    if (query.error) {
      setLoading('metrics', false);
    }
  }, [query.data, query.error, updateSystemMetrics, setLoading]);

  return query;
};

// Mutation hooks
export const useApproveTopic = () => {
  const { addNotification } = useAdminStore();

  return useMutation({
    mutationFn: approveTopic,
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Topic Approved',
        message: 'The trending topic has been approved successfully.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve the trending topic.'
      addNotification({
        type: 'error',
        title: 'Approval Failed',
        message: errorMessage,
        read: false
      });
    },
  });
};

export const useRejectTopic = () => {
  const { addNotification } = useAdminStore();

  return useMutation({
    mutationFn: rejectTopic,
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Topic Rejected',
        message: 'The trending topic has been rejected.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject the trending topic.'
      addNotification({
        type: 'error',
        title: 'Rejection Failed',
        message: errorMessage,
        read: false
      });
    },
  });
};

export const useApprovePoll = () => {
  const { addNotification } = useAdminStore();

  return useMutation({
    mutationFn: approvePoll,
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Poll Approved',
        message: 'The generated poll has been approved successfully.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve the generated poll.'
      addNotification({
        type: 'error',
        title: 'Approval Failed',
        message: errorMessage,
        read: false
      });
    },
  });
};

export const useRejectPoll = () => {
  const { addNotification } = useAdminStore();

  return useMutation({
    mutationFn: rejectPoll,
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Poll Rejected',
        message: 'The generated poll has been rejected.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject the generated poll.'
      addNotification({
        type: 'error',
        title: 'Rejection Failed',
        message: errorMessage,
        read: false
      });
    },
  });
};

export const useAnalyzeTrendingTopics = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useAdminStore();

  return useMutation({
    mutationFn: analyzeTrendingTopics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-topics'] });
      addNotification({
        type: 'success',
        title: 'Analysis Complete',
        message: 'Trending topics analysis has been completed.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze trending topics.'
      addNotification({
        type: 'error',
        title: 'Analysis Failed',
        message: errorMessage,
        read: false
      });
    },
  });
};

// Breaking News hooks
export const useBreakingNews = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['breaking-news'],
    queryFn: fetchBreakingNews,
    refetchInterval: 30000, // 30 seconds
  });

  // Invalidate related queries when breaking news updates
  React.useEffect(() => {
    if (query.data) {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['system-metrics'] });
    }
  }, [query.data, queryClient]);

  return query;
};

export const useCreateBreakingNews = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useAdminStore();

  return useMutation({
    mutationFn: createBreakingNews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breaking-news'] });
      addNotification({
        type: 'success',
        title: 'Story Created',
        message: 'Breaking news story has been created successfully.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create breaking news story.'
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: errorMessage,
        read: false
      });
    },
  });
};

export const useGeneratePollContext = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useAdminStore();

  return useMutation({
    mutationFn: generatePollContext,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breaking-news'] });
      addNotification({
        type: 'success',
        title: 'Poll Context Generated',
        message: 'Poll context has been generated successfully.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate poll context.'
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: errorMessage,
        read: false
      });
    },
  });
};

// Real-time subscription hook
export const useRealTimeSubscriptions = () => {
  const [subscriptions, setSubscriptions] = React.useState<string[]>([]);
  const [lastAdminEvent, setLastAdminEvent] = React.useState<AdminRealtimeEvent | null>(null);
  const [latestFeedbackEvent, setLatestFeedbackEvent] = React.useState<FeedbackRealtimeEvent | null>(null);

  const setSystemMetrics = useAdminStore((state) => state.setSystemMetrics);
  const addNotification = useAdminStore((state) => state.addNotification);
  const addActivityItem = useAdminStore((state) => state.addActivityItem);

  const handleAdminEvent = React.useCallback((event: AdminRealtimeEvent) => {
    setLastAdminEvent(event);

    switch (event.type) {
      case 'system-metrics': {
        setSystemMetrics(event.payload);
        logger.debug('Real-time admin metrics update received', event.payload);
        break;
      }
      case 'notification': {
        addNotification({
          type: event.payload.type,
          title: event.payload.title,
          message: event.payload.message,
          read: event.payload.read,
          metadata: event.payload.metadata,
          action: event.payload.action,
          timestamp: event.payload.timestamp,
          created_at: event.payload.created_at,
        });
        logger.info('Real-time admin notification received', {
          notificationId: event.payload.id,
          title: event.payload.title,
          type: event.payload.type,
        });
        break;
      }
      case 'activity': {
        addActivityItem({
          type: event.payload.type,
          title: event.payload.title,
          description: event.payload.description,
          user_id: event.payload.user_id,
          metadata: event.payload.metadata,
        });
        logger.debug('Real-time admin activity recorded', {
          id: event.payload.id,
          type: event.payload.type,
        });
        break;
      }
      default:
        break;
    }
  }, [addActivityItem, addNotification, setSystemMetrics]);

  const handleFeedbackEvent = React.useCallback((event: FeedbackRealtimeEvent) => {
    setLatestFeedbackEvent(event);
    const { payload } = event;

    const summary = `${payload.type.toUpperCase()}: ${payload.title}`;
    const metadata = {
      feedbackId: payload.feedbackId,
      priority: payload.priority,
      severity: payload.severity,
      sentiment: payload.sentiment,
      category: payload.category,
    };

    if (event.type === 'feedback-received') {
      addNotification({
        type: payload.priority === 'urgent' || payload.priority === 'high' ? 'warning' : 'info',
        title: 'New Feedback Received',
        message: summary,
        metadata,
      });
      logger.info('Real-time feedback received', {
        feedbackId: payload.feedbackId,
        priority: payload.priority,
      });
    } else if (event.type === 'feedback-updated') {
      addNotification({
        type: 'info',
        title: 'Feedback Updated',
        message: summary,
        metadata,
      });
      logger.debug('Real-time feedback updated', {
        feedbackId: payload.feedbackId,
        status: payload.severity,
      });
    }
  }, [addNotification]);

  React.useEffect(() => {
    // Subscribe to admin updates
    const adminSubscriptionId = realTimeService.subscribeToAdminUpdates(handleAdminEvent);

    // Subscribe to feedback updates
    const feedbackSubscriptionId = realTimeService.subscribeToFeedbackUpdates(handleFeedbackEvent);

    setSubscriptions([adminSubscriptionId, feedbackSubscriptionId]);

    // Cleanup on unmount
    return () => {
      realTimeService.unsubscribe(adminSubscriptionId);
      realTimeService.unsubscribe(feedbackSubscriptionId);
    };
  }, [handleAdminEvent, handleFeedbackEvent]);

  return {
    subscriptions,
    isConnected: subscriptions.length > 0,
    closeAll: () => {
      subscriptions.forEach(id => realTimeService.unsubscribe(id));
      setSubscriptions([]);
    },
    lastAdminEvent,
    latestFeedbackEvent,
  };
};


