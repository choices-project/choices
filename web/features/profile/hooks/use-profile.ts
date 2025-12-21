/**
 * Profile Feature Hooks
 *
 * Zustand-powered hooks for profile management. Provides a thin wrapper
 * around the profile store so feature components can consume a consistent API.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useUserProfileEditData } from '@/lib/stores';
import { profileSelectors, useProfileStore } from '@/lib/stores/profileStore';
import { useUserStore } from '@/lib/stores/userStore';
import logger from '@/lib/utils/logger';

import type {
  AvatarUploadResult,
  ExportOptions,
  ProfileActionResult,
  ProfileExportData,
  ProfileUpdateData,
  UseProfileAvatarReturn,
  UseProfileExportReturn,
  UseProfileReturn,
  UseProfileUpdateReturn,
} from '../index';

export const profileQueryKeys = {
  all: ['profile'] as const,
  current: () => [...profileQueryKeys.all, 'current'] as const,
  avatar: () => [...profileQueryKeys.all, 'avatar'] as const,
  export: () => [...profileQueryKeys.all, 'export'] as const,
} as const;

export function useProfile(): UseProfileReturn {
  const {
    currentProfile,
    isProfileLoaded,
    isProfileLoading,
    error,
    loadProfile,
    refreshProfile,
  } = useProfileStore(
    useShallow((state) => ({
      currentProfile: profileSelectors.currentProfile(state),
      isProfileLoaded: state.isProfileLoaded,
      isProfileLoading: state.isProfileLoading,
      error: state.error,
      loadProfile: state.loadProfile,
      refreshProfile: state.refreshProfile,
    })),
  );

  const shouldBypassProfileLoad = useMemo(
    () =>
      process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' &&
      typeof window !== 'undefined' &&
      window.localStorage.getItem('e2e-dashboard-bypass') === '1',
    [],
  );

  const fallbackProfile = useMemo(() => {
    if (!shouldBypassProfileLoad || typeof window === 'undefined') {
      return null;
    }
    try {
      const raw = window.localStorage.getItem('profile-store');
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      return parsed.state?.profile ?? parsed.state?.userProfile ?? null;
    } catch {
      return null;
    }
  }, [shouldBypassProfileLoad]);

  // Use refs for store actions to prevent infinite re-renders
  const loadProfileRef = useRef(loadProfile);
  useEffect(() => { loadProfileRef.current = loadProfile; }, [loadProfile]);

  useEffect(() => {
    if (shouldBypassProfileLoad) {
      return;
    }
    if (!isProfileLoaded && !isProfileLoading) {
      void loadProfileRef.current();
    }
  }, [isProfileLoaded, isProfileLoading, shouldBypassProfileLoad]);  

  // Use refs for refreshProfile
  const refreshProfileRef = useRef(refreshProfile);
  useEffect(() => { refreshProfileRef.current = refreshProfile; }, [refreshProfile]);

  const refetch = useCallback(async () => {
    await refreshProfileRef.current();
  }, []);  

  return useMemo(() => ({
    profile: currentProfile ?? fallbackProfile ?? null,
    isLoading: isProfileLoading,
    error,
    refetch,
  }), [currentProfile, fallbackProfile, isProfileLoading, error, refetch]);
}

export function useProfileUpdate(): UseProfileUpdateReturn {
  const { updateProfile: updateProfileAction, isUpdating, error } = useProfileStore(
    useShallow((state) => ({
      updateProfile: state.updateProfile,
      isUpdating: state.isUpdating,
      error: state.error,
    })),
  );

  // Use ref for store action to prevent infinite re-renders
  const updateProfileActionRef = useRef(updateProfileAction);
  useEffect(() => { updateProfileActionRef.current = updateProfileAction; }, [updateProfileAction]);

  const updateProfile = useCallback(
    async (data: ProfileUpdateData): Promise<ProfileActionResult> => {
      return await updateProfileActionRef.current(data);
    },
    [],  
  );

  return useMemo(() => ({
    updateProfile,
    isUpdating,
    error,
  }), [updateProfile, isUpdating, error]);
}

export function useProfileAvatar(): UseProfileAvatarReturn {
  const { updateAvatar, removeAvatar, isUploadingAvatar, error } = useProfileStore(
    useShallow((state) => ({
      updateAvatar: state.updateAvatar,
      removeAvatar: state.removeAvatar,
      isUploadingAvatar: state.isUploadingAvatar,
      error: state.error,
    })),
  );

  // Use refs for store actions to prevent infinite re-renders
  const updateAvatarRef = useRef(updateAvatar);
  useEffect(() => { updateAvatarRef.current = updateAvatar; }, [updateAvatar]);
  const removeAvatarRef = useRef(removeAvatar);
  useEffect(() => { removeAvatarRef.current = removeAvatar; }, [removeAvatar]);

  const uploadAvatar = useCallback(
    async (file: File): Promise<AvatarUploadResult> => {
      return await updateAvatarRef.current(file);
    },
    [],  
  );

  return useMemo(() => ({
    uploadAvatar,
    removeAvatar: removeAvatarRef.current,
    isUploading: isUploadingAvatar,
    error,
  }), [uploadAvatar, isUploadingAvatar, error]);
}

export function useProfileDraft() {
  return useUserProfileEditData();
}

export function useProfileDraftActions() {
  const setProfileEditData = useUserStore((state) => state.setProfileEditData);
  const updateProfileEditData = useUserStore((state) => state.updateProfileEditData);
  const updateProfileField = useUserStore((state) => state.updateProfileField);
  const updateArrayField = useUserStore((state) => state.updateArrayField);
  const updatePrivacySetting = useUserStore((state) => state.updatePrivacySetting);
  const setProfileEditing = useUserStore((state) => state.setProfileEditing);
  const clearAllProfileEditErrors = useUserStore((state) => state.clearAllProfileEditErrors);
  const setProfileEditError = useUserStore((state) => state.setProfileEditError);
  const clearProfileEditError = useUserStore((state) => state.clearProfileEditError);

  return useMemo(
    () => ({
      initializeDraft: setProfileEditData,
      mergeDraft: updateProfileEditData,
      setDraftField: updateProfileField,
      toggleDraftArrayField: updateArrayField,
      setDraftPrivacySetting: updatePrivacySetting,
      setProfileEditing,
      clearDraft: () => setProfileEditData(null),
      clearDraftErrors: clearAllProfileEditErrors,
      setFieldError: setProfileEditError,
      clearFieldError: clearProfileEditError,
    }),
    [
      setProfileEditData,
      updateProfileEditData,
      updateProfileField,
      updateArrayField,
      updatePrivacySetting,
      setProfileEditing,
      clearAllProfileEditErrors,
      setProfileEditError,
      clearProfileEditError,
    ],
  );
}

export function useProfileExport(): UseProfileExportReturn {
  const { exportProfile: exportProfileAction, isExporting, error } = useProfileStore(
    useShallow((state) => ({
      exportProfile: state.exportProfile,
      isExporting: state.isExporting,
      error: state.error,
    })),
  );

  // Use ref for store action to prevent infinite re-renders
  const exportProfileActionRef = useRef(exportProfileAction);
  useEffect(() => { exportProfileActionRef.current = exportProfileAction; }, [exportProfileAction]);

  const exportProfile = useCallback(
    async (options?: ExportOptions): Promise<ProfileExportData> => {
      const data = await exportProfileActionRef.current(options);

      if (!data) {
        const message = 'Failed to export profile data';
        logger.error(message);
        throw new Error(message);
      }

      return data;
    },
    [],  
  );

  return useMemo(() => ({
    exportProfile,
    isExporting,
    error,
  }), [exportProfile, isExporting, error]);
}

export function useProfileDelete() {
  const { deleteProfile: deleteProfileAction, isUpdating, error } = useProfileStore(
    useShallow((state) => ({
      deleteProfile: state.deleteProfile,
      isUpdating: state.isUpdating,
      error: state.error,
    })),
  );

  // Use ref for store action to prevent infinite re-renders
  const deleteProfileActionRef = useRef(deleteProfileAction);
  useEffect(() => { deleteProfileActionRef.current = deleteProfileAction; }, [deleteProfileAction]);

  const deleteProfile = useCallback(async (): Promise<ProfileActionResult> => {
    return await deleteProfileActionRef.current();
  }, []);  

  return useMemo(() => ({
    deleteProfile,
    isDeleting: isUpdating,
    error,
  }), [deleteProfile, isUpdating, error]);
}

export function useProfileLoadingStates() {
  const { isProfileLoading, isUpdating, isUploadingAvatar, isExporting } = useProfileStore(
    useShallow((state) => ({
      isProfileLoading: state.isProfileLoading,
      isUpdating: state.isUpdating,
      isUploadingAvatar: state.isUploadingAvatar,
      isExporting: state.isExporting,
    })),
  );

  return {
    isLoading: isProfileLoading,
    isUpdating,
    isUpdatingAvatar: isUploadingAvatar,
    isExporting,
    isAnyUpdating: isUpdating || isUploadingAvatar || isExporting,
  };
}

export function useProfileErrorStates() {
  const error = useProfileStore((state) => state.error);

  return {
    profileError: error,
    updateError: error,
    avatarError: error,
    exportError: error,
    hasAnyError: !!error,
  };
}

export function useProfileData() {
  const profile = useProfile();
  const loadingStates = useProfileLoadingStates();
  const errorStates = useProfileErrorStates();

  return Object.assign({}, profile, loadingStates, errorStates);
}

export function useProfileCompleteness() {
  const isComplete = useProfileStore((state) => state.isProfileComplete);
  const missingFields = useProfileStore((state) => state.missingFields);
  const completionPercentage = useProfileStore((state) => state.profileCompleteness);

  return {
    isComplete,
    missingFields,
    completionPercentage,
  };
}

export function useProfileDisplay() {
  const displayName = useProfileStore((state) => state.getDisplayName());
  const initials = useProfileStore((state) => state.getInitials());
  const trustTier = useProfileStore(
    (state) => (state.profile ?? state.userProfile)?.trust_tier ?? 'T0',
  );
  const trustTierDisplay = useProfileStore((state) => state.getTrustTierDisplay());
  const isAdmin = useProfileStore((state) => state.isAdmin());

  return {
    displayName,
    initials,
    trustTier,
    trustTierDisplay,
    isAdmin,
  };
}


