import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useAdminStore, TrendingTopic, GeneratedPoll, SystemMetrics } from './admin-store';

// Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// API functions
const fetchTrendingTopics = async (): Promise<TrendingTopic[]> => {
  const { data, error } = await supabase
    .from('trending_topics')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

const fetchGeneratedPolls = async (): Promise<GeneratedPoll[]> => {
  const { data, error } = await supabase
    .from('generated_polls')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
  // Get counts from different tables
  const [topicsResult, pollsResult, activePollsResult] = await Promise.all([
    supabase.from('trending_topics').select('count', { count: 'exact' }),
    supabase.from('generated_polls').select('count', { count: 'exact' }),
    supabase.from('po_polls').select('count', { count: 'exact' }).eq('status', 'active'),
  ]);

  return {
    total_topics: topicsResult.count || 0,
    total_polls: pollsResult.count || 0,
    active_polls: activePollsResult.count || 0,
    system_health: 'healthy', // TODO: Implement health check
    last_updated: new Date().toISOString(),
  };
};

const approveTopic = async (topicId: string): Promise<void> => {
  const { error } = await supabase
    .from('trending_topics')
    .update({ status: 'approved' })
    .eq('id', topicId);
  
  if (error) throw error;
};

const rejectTopic = async (topicId: string): Promise<void> => {
  const { error } = await supabase
    .from('trending_topics')
    .update({ status: 'rejected' })
    .eq('id', topicId);
  
  if (error) throw error;
};

const approvePoll = async (pollId: string): Promise<void> => {
  const { error } = await supabase
    .from('generated_polls')
    .update({ status: 'approved' })
    .eq('id', pollId);
  
  if (error) throw error;
};

const rejectPoll = async (pollId: string): Promise<void> => {
  const { error } = await supabase
    .from('generated_polls')
    .update({ status: 'rejected' })
    .eq('id', pollId);
  
  if (error) throw error;
};

const analyzeTrendingTopics = async (): Promise<void> => {
  const { error } = await supabase.rpc('analyze_trending_topics');
  if (error) throw error;
};

// Custom hooks
export const useTrendingTopics = () => {
  const queryClient = useQueryClient();
  const { updateTrendingTopics, setLoading } = useAdminStore();

  const query = useQuery({
    queryKey: ['trending-topics'],
    queryFn: fetchTrendingTopics,
    refetchInterval: 30000, // 30 seconds
  });

  React.useEffect(() => {
    if (query.data) {
      updateTrendingTopics(query.data);
      setLoading('topics', false);
    }
    if (query.error) {
      setLoading('topics', false);
    }
  }, [query.data, query.error, updateTrendingTopics, setLoading]);

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

// Real-time subscription hook
export const useRealTimeSubscriptions = () => {
  const { addTopic, updateTopic, addPoll, updatePoll } = useAdminStore();

  React.useEffect(() => {
    // Subscribe to trending topics changes
    const topicsSubscription = supabase
      .channel('trending-topics-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trending_topics',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          addTopic(payload.new as TrendingTopic);
        } else if (payload.eventType === 'UPDATE') {
          updateTopic(payload.new.id, payload.new as Partial<TrendingTopic>);
        }
      })
      .subscribe();

    // Subscribe to generated polls changes
    const pollsSubscription = supabase
      .channel('generated-polls-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'generated_polls',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          addPoll(payload.new as GeneratedPoll);
        } else if (payload.eventType === 'UPDATE') {
          updatePoll(payload.new.id, payload.new as Partial<GeneratedPoll>);
        }
      })
      .subscribe();

    return () => {
      topicsSubscription.unsubscribe();
      pollsSubscription.unsubscribe();
    };
  }, [addTopic, updateTopic, addPoll, updatePoll]);
};
