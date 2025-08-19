import React from 'react';
import { devLog } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminStore, TrendingTopic, GeneratedPoll, SystemMetrics } from './admin-store';
import { mockActivityFeed } from './mock-data';

// Mock data for fallback
const mockTrendingTopics: TrendingTopic[] = [
  {
    id: '1',
    title: 'Climate Change Policy',
    category: 'environment',
    trend_score: 0.8,
    status: 'pending',
    created_at: new Date().toISOString(),
    source: 'automated'
  }
];

const mockGeneratedPolls: GeneratedPoll[] = [
  {
    id: '1',
    title: 'Should renewable energy be prioritized over fossil fuels?',
    options: ['Yes', 'No', 'Undecided'],
    source_topic_id: '1',
    status: 'pending',
    created_at: new Date().toISOString(),
    metrics: {
      total_votes: 0,
      engagement_rate: 0.7
    }
  }
];

const mockSystemMetrics: SystemMetrics = {
  total_topics: 25,
  total_polls: 45,
  active_polls: 12,
  system_health: 'healthy',
  last_updated: new Date().toISOString()
};

import { BreakingNewsStory, PollContext } from './real-time-news-service';

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
    }
    if (query.error) {
      setLoading('topics', false);
    }
  }, [query.data, query.error, updateTrendingTopics, setLoading, updateActivityFeed]);

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
    }
    if (query.error) {
      setLoading('polls', false);
    }
  }, [query.data, query.error, updateGeneratedPolls, setLoading]);

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
      addNotification({
        type: 'error',
        title: 'Approval Failed',
        message: 'Failed to approve the trending topic.',
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
      addNotification({
        type: 'error',
        title: 'Rejection Failed',
        message: 'Failed to reject the trending topic.',
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
      addNotification({
        type: 'error',
        title: 'Approval Failed',
        message: 'Failed to approve the generated poll.',
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
      addNotification({
        type: 'error',
        title: 'Rejection Failed',
        message: 'Failed to reject the generated poll.',
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
      addNotification({
        type: 'error',
        title: 'Analysis Failed',
        message: 'Failed to analyze trending topics.',
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
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create breaking news story.',
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
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate poll context.',
      });
    },
  });
};

// Real-time subscription hook (disabled for now - using API routes instead)
export const useRealTimeSubscriptions = () => {
  // TODO: Implement real-time updates via WebSocket or Server-Sent Events when needed
  // For now, we rely on React Query's refetch intervals for data updates
  React.useEffect(() => {
    // No real-time subscriptions for now
  }, []);
};
