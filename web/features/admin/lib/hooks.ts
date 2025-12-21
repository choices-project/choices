import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { useAdminActions, useNotificationActions } from '@/lib/stores';
import { logger, devLog } from '@/lib/utils/logger';

import { realTimeService } from './real-time-service';

import type {
  TrendingTopic,
  GeneratedPoll,
  SystemMetrics,
  BreakingNewsStory,
  PollContext,
  AdminRealtimeEvent,
  FeedbackRealtimeEvent,
  NewAdminNotification,
  ActivityItem,
} from '../types';


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
  const { setTrendingTopics } = useAdminActions();

  const query = useQuery({
    queryKey: ['trending-topics'],
    queryFn: fetchTrendingTopics,
    refetchInterval: 30000, // 30 seconds
  });

  React.useEffect(() => {
    if (query.data) {
      setTrendingTopics(query.data);

      if (query.data === emptyTrendingTopics || query.data.length === 0) {
        logger.warn('⚠️ Admin Dashboard: No trending topics data available. Check API endpoints.');
      }

      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    }
  }, [query.data, setTrendingTopics, queryClient]);

  return query;
};

export const useGeneratedPolls = () => {
  const queryClient = useQueryClient();
  const { setGeneratedPolls } = useAdminActions();

  const query = useQuery({
    queryKey: ['generated-polls'],
    queryFn: fetchGeneratedPolls,
    refetchInterval: 30000, // 30 seconds
  });

  React.useEffect(() => {
    if (query.data) {
      setGeneratedPolls(query.data);

      // Invalidate related queries when generated polls update
      queryClient.invalidateQueries({ queryKey: ['system-metrics'] });
    }
  }, [query.data, setGeneratedPolls, queryClient]);

  return query;
};

export const useSystemMetrics = () => {
  const { setSystemMetrics } = useAdminActions();

  const query = useQuery({
    queryKey: ['system-metrics'],
    queryFn: fetchSystemMetrics,
    refetchInterval: 60000, // 1 minute
  });

  React.useEffect(() => {
    if (query.data) {
      setSystemMetrics(query.data);
    }
  }, [query.data, setSystemMetrics]);

  return query;
};

// Mutation hooks
export const useApproveTopic = () => {
  const { addAdminNotification } = useNotificationActions();

  return useMutation({
    mutationFn: approveTopic,
    onSuccess: () => {
      addAdminNotification({
        type: 'success',
        title: 'Topic Approved',
        message: 'The trending topic has been approved successfully.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve the trending topic.'
      addAdminNotification({
        type: 'error',
        title: 'Approval Failed',
        message: errorMessage,
        read: false
      });
    },
  });
};

export const useRejectTopic = () => {
  const { addAdminNotification } = useNotificationActions();

  return useMutation({
    mutationFn: rejectTopic,
    onSuccess: () => {
      addAdminNotification({
        type: 'success',
        title: 'Topic Rejected',
        message: 'The trending topic has been rejected.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject the trending topic.'
      addAdminNotification({
        type: 'error',
        title: 'Rejection Failed',
        message: errorMessage,
        read: false
      });
    },
  });
};

export const useApprovePoll = () => {
  const { addAdminNotification } = useNotificationActions();

  return useMutation({
    mutationFn: approvePoll,
    onSuccess: () => {
      addAdminNotification({
        type: 'success',
        title: 'Poll Approved',
        message: 'The generated poll has been approved successfully.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve the generated poll.'
      addAdminNotification({
        type: 'error',
        title: 'Approval Failed',
        message: errorMessage,
        read: false
      });
    },
  });
};

export const useRejectPoll = () => {
  const { addAdminNotification } = useNotificationActions();

  return useMutation({
    mutationFn: rejectPoll,
    onSuccess: () => {
      addAdminNotification({
        type: 'success',
        title: 'Poll Rejected',
        message: 'The generated poll has been rejected.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject the generated poll.'
      addAdminNotification({
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
  const { addAdminNotification } = useNotificationActions();

  return useMutation({
    mutationFn: analyzeTrendingTopics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-topics'] });
      addAdminNotification({
        type: 'success',
        title: 'Analysis Complete',
        message: 'Trending topics analysis has been completed.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze trending topics.'
      addAdminNotification({
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
  const { addAdminNotification } = useNotificationActions();

  return useMutation({
    mutationFn: createBreakingNews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breaking-news'] });
      addAdminNotification({
        type: 'success',
        title: 'Story Created',
        message: 'Breaking news story has been created successfully.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create breaking news story.'
      addAdminNotification({
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
  const { addAdminNotification } = useNotificationActions();

  return useMutation({
    mutationFn: generatePollContext,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breaking-news'] });
      addAdminNotification({
        type: 'success',
        title: 'Poll Context Generated',
        message: 'Poll context has been generated successfully.',
        read: false
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate poll context.'
      addAdminNotification({
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

  const { setSystemMetrics, addActivityItem } = useAdminActions();
  const { addAdminNotification } = useNotificationActions();

  // Use refs for stable store actions to prevent infinite re-renders
  const setSystemMetricsRef = React.useRef(setSystemMetrics);
  const addActivityItemRef = React.useRef(addActivityItem);
  const addAdminNotificationRef = React.useRef(addAdminNotification);

  React.useEffect(() => {
    setSystemMetricsRef.current = setSystemMetrics;
    addActivityItemRef.current = addActivityItem;
    addAdminNotificationRef.current = addAdminNotification;
  }, [setSystemMetrics, addActivityItem, addAdminNotification]);

  const handleAdminEvent = React.useCallback((event: AdminRealtimeEvent) => {
    setLastAdminEvent(event);

    switch (event.type) {
      case 'system-metrics': {
        setSystemMetricsRef.current(event.payload);
        logger.debug('Real-time admin metrics update received', event.payload);
        break;
      }
      case 'notification': {
        const notificationPayload: NewAdminNotification = {
          type: event.payload.type,
          title: event.payload.title,
          message: event.payload.message,
          read: event.payload.read,
          timestamp: event.payload.timestamp,
          created_at: event.payload.created_at,
        };

        if (event.payload.metadata) {
          notificationPayload.metadata = event.payload.metadata;
        }
        if (event.payload.action) {
          notificationPayload.action = event.payload.action;
        }

        addAdminNotificationRef.current(notificationPayload);
        logger.info('Real-time admin notification received', {
          notificationId: event.payload.id,
          title: event.payload.title,
          type: event.payload.type,
        });
        break;
      }
      case 'activity': {
        const activityPayload: Omit<ActivityItem, 'id' | 'timestamp'> = {
          type: event.payload.type,
          title: event.payload.title,
          description: event.payload.description,
        };

        if (event.payload.user_id) {
          activityPayload.user_id = event.payload.user_id;
        }

        if (event.payload.metadata) {
          activityPayload.metadata = event.payload.metadata;
        }

        addActivityItemRef.current(activityPayload);
        logger.debug('Real-time admin activity recorded', {
          id: event.payload.id,
          type: event.payload.type,
        });
        break;
      }
      default:
        break;
    }
  }, []); // Empty deps - using refs

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
      addAdminNotificationRef.current({
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
      addAdminNotificationRef.current({
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
  }, []); // Empty deps - using refs

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

  const closeAllRef = React.useRef<() => void>();
  closeAllRef.current = () => {
    subscriptions.forEach(id => realTimeService.unsubscribe(id));
    setSubscriptions([]);
  };

  return React.useMemo(
    () => ({
      subscriptions,
      isConnected: subscriptions.length > 0,
      closeAll: () => closeAllRef.current?.(),
      lastAdminEvent,
      latestFeedbackEvent,
    }),
    [subscriptions, lastAdminEvent, latestFeedbackEvent],
  );
};


