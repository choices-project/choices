/**
 * Profile Feature Hooks
 * 
 * React Query hooks for profile management
 * Consolidates profile hooks from across the codebase
 * 
 * Created: December 19, 2024
 * Status: ✅ CONSOLIDATED
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { withOptional } from '@/lib/utils/objects';

import { 
  getCurrentProfile, 
  updateProfile, 
  updateProfileAvatar, 
  exportUserData,
  deleteProfile
} from '../lib/profile-service';
import type { UserProfile, ProfileUpdateData, ExportOptions } from '../types';
import type { 
  UseProfileReturn, 
  UseProfileUpdateReturn, 
  UseProfileAvatarReturn, 
  UseProfileExportReturn 
} from '../types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const profileQueryKeys = {
  all: ['profile'] as const,
  current: () => [...profileQueryKeys.all, 'current'] as const,
  avatar: () => [...profileQueryKeys.all, 'avatar'] as const,
  export: () => [...profileQueryKeys.all, 'export'] as const,
} as const;

// ============================================================================
// PROFILE QUERY HOOKS
// ============================================================================

/**
 * Hook to get current user profile
 * Superior implementation with proper caching and error handling
 */
export function useProfile(): UseProfileReturn {
  const query = useQuery({
    queryKey: profileQueryKeys.current(),
    queryFn: getCurrentProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    profile: query.data?.data as UserProfile || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isStale: query.isStale,
  };
}

// ============================================================================
// PROFILE MUTATION HOOKS
// ============================================================================

/**
 * Hook to update current user profile
 * Superior implementation with optimistic updates
 */
export function useProfileUpdate(): UseProfileUpdateReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateProfile,
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

  return {
    updateProfile: async (updates: ProfileUpdateData) => {
      await mutation.mutateAsync(updates);
    },
    isUpdating: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}

/**
 * Hook to update profile avatar
 * Superior implementation with file handling
 */
export function useProfileAvatar(): UseProfileAvatarReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateProfileAvatar,
    onSuccess: () => {
      // Invalidate profile queries to refetch with new avatar
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.current() });
    },
  });

  return {
    uploadAvatar: async (file: File) => {
      return await mutation.mutateAsync(file);
    },
    removeAvatar: async () => {
      // Implement avatar removal logic
      const result = await updateProfileAvatar(new File([], 'remove', { type: 'image/png' }));
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.current() });
      }
      return;
    },
    isUploading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to export user data
 * Superior implementation with proper data handling
 */
export function useProfileExport(): UseProfileExportReturn {
  const mutation = useMutation({
    mutationFn: exportUserData,
    onSuccess: async (data) => {
      // Create and download file
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
          type: 'application/json' 
        });
        
        // Use SSR-safe browser API access
        try {
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
        } catch (error) {
          console.error('Error downloading export file:', error);
        }
      }
    },
  });

  return {
    exportData: async (options?: ExportOptions) => {
      return await mutation.mutateAsync(options);
    },
    isExporting: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}

/**
 * Hook to delete user profile
 * Handles profile deletion with confirmation
 */
export function useProfileDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      // Clear all profile-related queries
      queryClient.removeQueries({ queryKey: profileQueryKeys.all });
      // Redirect to home page or show success message
      window.location.href = '/';
    },
  });
}

// ============================================================================
// COMPOSITE HOOKS
// ============================================================================

/**
 * Hook to get profile loading states
 * Superior implementation for better UX
 */
export function useProfileLoadingStates() {
  const profileQuery = useProfile();
  const updateMutation = useProfileUpdate();
  const avatarMutation = useProfileAvatar();
  const exportMutation = useProfileExport();

  return {
    isLoading: profileQuery.isLoading,
    isUpdating: updateMutation.isUpdating,
    isUpdatingAvatar: avatarMutation.isUploading,
    isExporting: exportMutation.isExporting,
    isAnyUpdating: updateMutation.isUpdating || avatarMutation.isUploading || exportMutation.isExporting,
  };
}

/**
 * Hook to get profile error states
 * Superior implementation for better error handling
 */
export function useProfileErrorStates() {
  const profileQuery = useProfile();
  const updateMutation = useProfileUpdate();
  const avatarMutation = useProfileAvatar();
  const exportMutation = useProfileExport();

  return {
    profileError: profileQuery.error,
    updateError: updateMutation.error,
    avatarError: avatarMutation.error,
    exportError: exportMutation.error,
    hasAnyError: !!(
      profileQuery.error || 
      updateMutation.error || 
      avatarMutation.error || 
      exportMutation.error
    ),
  };
}

/**
 * Hook to get profile data with loading and error states
 * Comprehensive profile state management
 */
export function useProfileData() {
  const profile = useProfile();
  const loadingStates = useProfileLoadingStates();
  const errorStates = useProfileErrorStates();

  return withOptional(profile, withOptional(loadingStates, errorStates));
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to check if profile is complete
 * Determines if profile has all required fields
 */
export function useProfileCompleteness() {
  const { profile } = useProfile();
  
  const isComplete = profile ? (
    !!(profile.display_name && profile.username && profile.email)
  ) : false;

  const missingFields = profile ? [
    !profile.display_name && 'Display Name',
    !profile.username && 'Username',
    !profile.email && 'Email',
  ].filter(Boolean) : [];

  return {
    isComplete,
    missingFields,
    completionPercentage: profile ? 
      Math.round((3 - missingFields.length) / 3 * 100) : 0,
  };
}

/**
 * Hook to get profile display information
 * Provides formatted display data
 */
export function useProfileDisplay() {
  const { profile } = useProfile();
  
  if (!profile) {
    return {
      displayName: 'User',
      initials: 'U',
      trustTier: 'T0',
      trustTierDisplay: 'New User',
      isAdmin: false,
    };
  }

  const displayName = profile.display_name || profile.username || profile.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const trustTierDisplay = {
    'T0': 'New User',
    'T1': 'Verified User',
    'T2': 'Trusted User',
    'T3': 'VIP User',
  }[profile.trust_tier] || 'Unknown';

  return {
    displayName,
    initials,
    trustTier: profile.trust_tier,
    trustTierDisplay,
    isAdmin: profile.is_admin,
  };
}
