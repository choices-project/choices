/**
 * useFollowRepresentative Hook
 * 
 * Client-side hook for following/unfollowing representatives
 * Manages local state and syncs with API
 * 
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 */

import { useCallback, useState, useEffect } from 'react';

import { logger } from '@/lib/utils/logger';

export type FollowStatus = {
  following: boolean;
  loading: boolean;
  error: string | null;
};

export type FollowPreferences = {
  notify_on_votes?: boolean;
  notify_on_committee_activity?: boolean;
  notify_on_public_statements?: boolean;
  notify_on_events?: boolean;
  notes?: string;
  tags?: string[];
};

/**
 * Hook for managing representative follow state
 */
export function useFollowRepresentative(representativeId: number | null) {
  const [status, setStatus] = useState<FollowStatus>({
    following: false,
    loading: true,
    error: null
  });

  // Check initial follow status
  useEffect(() => {
    if (!representativeId) {
      setStatus({ following: false, loading: false, error: null });
      return;
    }

    const checkFollowStatus = async () => {
      try {
        setStatus(prev => ({ ...prev, loading: true, error: null }));

        const response = await fetch(`/api/representatives/${representativeId}/follow`);
        
        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated - not an error, just not following
            setStatus({ following: false, loading: false, error: null });
            return;
          }
          throw new Error('Failed to check follow status');
        }

        const data = await response.json();
        
        setStatus({
          following: data.following ?? false,
          loading: false,
          error: null
        });
      } catch (error) {
        logger.error('Error checking follow status:', error);
        setStatus({
          following: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to check follow status'
        });
      }
    };

    void checkFollowStatus();
  }, [representativeId]);

  const follow = useCallback(async (preferences?: FollowPreferences) => {
    if (!representativeId) {
      setStatus(prev => ({ ...prev, error: 'No representative ID provided' }));
      return false;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/representatives/${representativeId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: preferences ? JSON.stringify(preferences) : undefined
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Failed to follow representative');
      }

      const data = await response.json();
      
      setStatus({
        following: true,
        loading: false,
        error: null
      });

      return true;
    } catch (error) {
      logger.error('Error following representative:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to follow representative'
      }));
      return false;
    }
  }, [representativeId]);

  const unfollow = useCallback(async () => {
    if (!representativeId) {
      setStatus(prev => ({ ...prev, error: 'No representative ID provided' }));
      return false;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/representatives/${representativeId}/follow`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Failed to unfollow representative');
      }

      setStatus({
        following: false,
        loading: false,
        error: null
      });

      return true;
    } catch (error) {
      logger.error('Error unfollowing representative:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to unfollow representative'
      }));
      return false;
    }
  }, [representativeId]);

  const toggle = useCallback(async () => {
    if (status.following) {
      return await unfollow();
    } else {
      return await follow();
    }
  }, [status.following, follow, unfollow]);

  return {
    ...status,
    follow,
    unfollow,
    toggle
  };
}

