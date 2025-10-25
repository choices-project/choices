/**
 * Enhanced Profile React Query Hooks
 * 
 * Superior implementation using React Query for state management
 * Provides proper caching, optimistic updates, and error handling
 * 
 * Created: January 27, 2025
 * Status: ✅ SUPERIOR IMPLEMENTATION
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { 
  updateCurrentProfile, 
  updateProfileAvatar, 
  exportUserData 
} from '@/lib/actions/profile';

/**
 * Fetch current profile from API endpoint
 * Superior implementation using API route instead of server action
 */
async function getCurrentProfile() {
  const response = await fetch('/api/profile', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  
  const apiData = await response.json();
  
  // Transform API response to match expected format
  return {
    success: true,
    data: {
      ...apiData.profile,
      email: apiData.profile?.email,
    },
  };
}

// Query keys for consistent caching
export const profileQueryKeys = {
  all: ['profile'] as const,
  current: () => [...profileQueryKeys.all, 'current'] as const,
} as const;

/**
 * Hook to get current user profile
 * Superior implementation with proper caching and error handling
 */
export function useProfile() {
  return useQuery({
    queryKey: profileQueryKeys.current(),
    queryFn: getCurrentProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to update current user profile
 * Superior implementation with optimistic updates
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCurrentProfile,
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileQueryKeys.current() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(profileQueryKeys.current());

      // Optimistically update
      queryClient.setQueryData(profileQueryKeys.current(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...(old || {}),
          data: { ...(old.data || {}), ...(newData || {}) },
        };
      });

      return { previousProfile };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(profileQueryKeys.current(), context.previousProfile);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.current() });
    },
  });
}

/**
 * Hook to update profile avatar
 * Superior implementation with file handling
 */
export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileAvatar,
    onSuccess: () => {
      // Invalidate profile queries to refetch with new avatar
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.current() });
    },
  });
}

/**
 * Hook to export user data
 * Superior implementation with proper data handling
 */
export function useExportData() {
  return useMutation({
    mutationFn: exportUserData,
    onSuccess: async (data: any) => {
      // Create and download file
      if (data?.success && data?.data) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
          type: 'application/json' 
        });
        // Use SSR-safe browser API access
        const { safeWindow, safeDocument } = await import('@/lib/utils/ssr-safe');
        const url = safeWindow(w => w.URL?.createObjectURL?.(blob));
        if (url) {
          const a = safeDocument(d => d.createElement?.('a')) as HTMLAnchorElement;
          if (a) {
            a.href = url;
            a.download = `profile-export-${new Date().toISOString().split('T')[0]}.json`;
            safeDocument(d => d.body?.appendChild?.(a));
            a.click();
            safeDocument(d => d.body?.removeChild?.(a));
            safeWindow(w => w.URL?.revokeObjectURL?.(url));
          }
        }
      }
    },
  });
}

/**
 * Hook to get profile loading states
 * Superior implementation for better UX
 */
export function useProfileLoadingStates() {
  const profileQuery = useProfile();
  const updateMutation = useUpdateProfile();
  const avatarMutation = useUpdateAvatar();

  return {
    isLoading: profileQuery.isLoading,
    isUpdating: updateMutation.isPending,
    isUpdatingAvatar: avatarMutation.isPending,
    isAnyUpdating: updateMutation.isPending || avatarMutation.isPending,
  };
}

/**
 * Hook to get profile error states
 * Superior implementation for better error handling
 */
export function useProfileErrorStates() {
  const profileQuery = useProfile();
  const updateMutation = useUpdateProfile();
  const avatarMutation = useUpdateAvatar();

  return {
    profileError: profileQuery.error,
    updateError: updateMutation.error,
    avatarError: avatarMutation.error,
    hasAnyError: !!(profileQuery.error || updateMutation.error || avatarMutation.error),
  };
}