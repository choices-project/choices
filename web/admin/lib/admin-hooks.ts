import React from 'react';
import { devLog } from '../../shared/utils/lib/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminStore, TrendingTopic, GeneratedPoll, SystemMetrics } from './admin-store';
import { mockActivityFeed } from './mock-data';
import { realTimeService } from './real-time-service';

// Mock data for fallback
const mockTrendingTopics: TrendingTopic[] = [
  {
    id: '1',
    title: 'Climate Change Policy',
    description: 'Analysis of climate change policy impacts and public opinion',
    category: 'environment',
    trending_score: 0.8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockGeneratedPolls: GeneratedPoll[] = [
  {
    id: '1',
    title: 'Should renewable energy be prioritized over fossil fuels?',
    description: 'Public opinion on renewable energy policy priorities',
    options: ['Yes', 'No', 'Undecided'],
    category: 'environment',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockSystemMetrics: SystemMetrics = {
  total_topics: 25,
  total_polls: 45,
  active_polls: 12,
  system_health: 'healthy',
  last_updated: new Date().toISOString()
};

// Real-time news service disabled for now - using mock types
import { BreakingNewsStory, PollContext } from './mock-data';

// Remove duplicate devLog definition - using imported one from logger

// API functions
const fetchTrendingTopics = async (): Promise<TrendingTopic[]> => {
  try {
    const response = await fetch('/api/admin/trending-topics');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    devLog('Fetched trending topics from API', { count: data.topics?.length || 0 });
    return data.topics || mockTrendingTopics;
  } catch (error) {
    devLog('Error fetching trending topics, using mock data', error);
    return mockTrendingTopics;
  }
};

const fetchGeneratedPolls = async (): Promise<GeneratedPoll[]> => {
  try {
    const response = await fetch('/api/admin/generated-polls');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    devLog('Fetched generated polls from API', { count: data.polls?.length || 0 });
    return data.polls || mockGeneratedPolls;
  } catch (error) {
    devLog('Error fetching generated polls, using mock data', error);
    return mockGeneratedPolls;
  }
};

const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    const response = await fetch('/api/admin/system-metrics');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    devLog('Fetched system metrics from API', data.metrics);
    return data.metrics || mockSystemMetrics;
  } catch (error) {
    devLog('Error fetching system metrics, using mock data', error);
    return mockSystemMetrics;
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
    devLog('Error fetching breaking news, using empty array', error);
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
      
      // Initialize activity feed with mock data if empty
      if (query.data === mockTrendingTopics) {
        updateActivityFeed(mockActivityFeed as any);
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
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve the trending topic.'
      addNotification({
        type: 'error',
        title: 'Approval Failed',
        message: errorMessage,
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
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject the trending topic.'
      addNotification({
        type: 'error',
        title: 'Rejection Failed',
        message: errorMessage,
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
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve the generated poll.'
      addNotification({
        type: 'error',
        title: 'Approval Failed',
        message: errorMessage,
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
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject the generated poll.'
      addNotification({
        type: 'error',
        title: 'Rejection Failed',
        message: errorMessage,
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
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze trending topics.'
      addNotification({
        type: 'error',
        title: 'Analysis Failed',
        message: errorMessage,
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
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create breaking news story.'
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: errorMessage,
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
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate poll context.'
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: errorMessage,
      });
    },
  });
};

// Real-time subscription hook
export const useRealTimeSubscriptions = () => {
  const [subscriptions, setSubscriptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Subscribe to admin updates
    const adminSubscriptionId = realTimeService.subscribeToAdminUpdates(
      (_data) => {
        // Handle admin updates
        // console.log('Admin real-time update:', data);
      }
    );

    // Subscribe to feedback updates
    const feedbackSubscriptionId = realTimeService.subscribeToFeedbackUpdates(
      (_data) => {
        // Handle feedback updates
        // console.log('Feedback real-time update:', data);
      }
    );

    setSubscriptions([adminSubscriptionId, feedbackSubscriptionId]);

    // Cleanup on unmount
    return () => {
      realTimeService.unsubscribe(adminSubscriptionId);
      realTimeService.unsubscribe(feedbackSubscriptionId);
    };
  }, []);

  return {
    subscriptions,
    isConnected: subscriptions.length > 0,
    closeAll: () => {
      subscriptions.forEach(id => realTimeService.unsubscribe(id));
      setSubscriptions([]);
    }
  };
};
