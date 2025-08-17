import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useAdminStore, TrendingTopic, GeneratedPoll, SystemMetrics } from './admin-store';
import { 
  mockTrendingTopics, 
  mockGeneratedPolls, 
  mockSystemMetrics, 
  mockActivityFeed 
} from './mock-data';

// Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// API functions
const fetchTrendingTopics = async (): Promise<TrendingTopic[]> => {
  try {
    // Try to fetch from database first
    const { data, error } = await supabase
      .from('trending_topics')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('Database error, using mock data:', error);
      return mockTrendingTopics;
    }
    
    if (!data || data.length === 0) {
      console.log('No data in database, using mock data');
      return mockTrendingTopics;
    }
    
    console.log('Fetched trending topics from database:', data.length);
    return data;
  } catch (error) {
    console.log('Error fetching trending topics, using mock data:', error);
    return mockTrendingTopics;
  }
};

const fetchGeneratedPolls = async (): Promise<GeneratedPoll[]> => {
  try {
    // Try to fetch from database first
    const { data, error } = await supabase
      .from('generated_polls')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('Database error, using mock data:', error);
      return mockGeneratedPolls;
    }
    
    if (!data || data.length === 0) {
      console.log('No data in database, using mock data');
      return mockGeneratedPolls;
    }
    
    console.log('Fetched generated polls from database:', data.length);
    return data;
  } catch (error) {
    console.log('Error fetching generated polls, using mock data:', error);
    return mockGeneratedPolls;
  }
};

const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    // For now, return mock data since we don't have a system metrics API yet
    console.log('Using mock system metrics data for development');
    return mockSystemMetrics;
    
    // TODO: Create system metrics API endpoint when needed
    /*
    const response = await fetch('/api/admin/system-metrics');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.metrics || mockSystemMetrics;
    */
  } catch (error) {
    console.log('Error fetching system metrics, using mock data:', error);
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
        updateActivityFeed(mockActivityFeed);
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
  const queryClient = useQueryClient();
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
  const queryClient = useQueryClient();
  const { addNotification } = useAdminStore();

  return useMutation({
    mutationFn: approveTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-topics'] });
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
  const queryClient = useQueryClient();
  const { addNotification } = useAdminStore();

  return useMutation({
    mutationFn: rejectTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-topics'] });
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
  const queryClient = useQueryClient();
  const { addNotification } = useAdminStore();

  return useMutation({
    mutationFn: approvePoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-polls'] });
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
  const queryClient = useQueryClient();
  const { addNotification } = useAdminStore();

  return useMutation({
    mutationFn: rejectPoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-polls'] });
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

// Real-time subscription hook (disabled for now - using API routes instead)
export const useRealTimeSubscriptions = () => {
  // TODO: Implement real-time updates via WebSocket or Server-Sent Events when needed
  // For now, we rely on React Query's refetch intervals for data updates
  React.useEffect(() => {
    // No real-time subscriptions for now
  }, []);
};
