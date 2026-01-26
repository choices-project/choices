/**
 * Profile Feature Hooks
 *
 * Zustand-powered hooks for profile management. Provides a thin wrapper
 * around the profile store so feature components can consume a consistent API.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useUserProfileEditData, useUserActions } from '@/lib/stores';
import {
  useProfileActions,
  useProfileCurrentProfile,
  useProfileError,
  useProfileLoading,
  useProfileStats,
  useProfileDisplay as useProfileDisplayStore,
} from '@/lib/stores/profileStore';
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
  const currentProfile = useProfileCurrentProfile();
  const { isProfileLoaded } = useProfileStats();
  const { isLoading: isProfileLoading } = useProfileLoading();
  const { error } = useProfileError();
  const { loadProfile, refreshProfile } = useProfileActions();

  // CRITICAL: Use useState instead of useMemo to prevent hydration mismatch
  // Initialize to false, then check localStorage in useEffect after mount
  const [shouldBypassProfileLoad, setShouldBypassProfileLoad] = useState(false);
  
  useEffect(() => {
    const bypass = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' &&
      typeof window !== 'undefined' &&
      window.localStorage.getItem('e2e-dashboard-bypass') === '1';
    setShouldBypassProfileLoad(bypass);
  }, []);

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
    // #region agent log
    if (process.env.NODE_ENV === 'development') {
      fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-profile.ts:87',message:'useEffect check for loadProfile',data:{shouldBypassProfileLoad,isProfileLoaded,isProfileLoading,shouldCall:!shouldBypassProfileLoad && !isProfileLoaded && !isProfileLoading,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(() => undefined);
    }
    // #endregion
    if (shouldBypassProfileLoad) {
      return;
    }
    if (!isProfileLoaded && !isProfileLoading) {
      // #region agent log
      if (process.env.NODE_ENV === 'development') {
        fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-profile.ts:92',message:'Calling loadProfile from useEffect',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(() => undefined);
      }
      // #endregion
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
  const { updateProfile: updateProfileAction } = useProfileActions();
  const { isUpdating } = useProfileLoading();
  const { error } = useProfileError();

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
  const { updateAvatar, removeAvatar } = useProfileActions();
  const { isUploadingAvatar } = useProfileLoading();
  const { error } = useProfileError();

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

  return useMemo(
    () => ({
      uploadAvatar,
      removeAvatar,
      isUploading: isUploadingAvatar,
      error,
    }),
    [uploadAvatar, removeAvatar, isUploadingAvatar, error],
  );
}

export function useProfileDraft() {
  return useUserProfileEditData();
}

export function useProfileDraftActions() {
  const {
    setProfileEditData,
    updateProfileEditData,
    updateProfileField,
    updateArrayField,
    updatePrivacySetting,
    setProfileEditing,
    clearAllProfileEditErrors,
    setProfileEditError,
    clearProfileEditError,
  } = useUserActions();

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
  const { exportProfile: exportProfileAction } = useProfileActions();
  const { isExporting } = useProfileLoading();
  const { error } = useProfileError();

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
  const { deleteProfile: deleteProfileAction } = useProfileActions();
  const { isUpdating } = useProfileLoading();
  const { error } = useProfileError();

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
  const {
    isLoading: isProfileLoading,
    isUpdating,
    isUploadingAvatar,
    isExporting,
  } = useProfileLoading();

  return useMemo(
    () => ({
      isLoading: isProfileLoading,
      isUpdating,
      isUpdatingAvatar: isUploadingAvatar,
      isExporting,
      isAnyUpdating: isUpdating || isUploadingAvatar || isExporting,
    }),
    [isProfileLoading, isUpdating, isUploadingAvatar, isExporting],
  );
}

export function useProfileErrorStates() {
  const { error } = useProfileError();

  return useMemo(
    () => ({
      profileError: error,
      updateError: error,
      avatarError: error,
      exportError: error,
      hasAnyError: !!error,
    }),
    [error],
  );
}

export function useProfileData() {
  const profile = useProfile();
  const loadingStates = useProfileLoadingStates();
  const errorStates = useProfileErrorStates();

  return useMemo(
    () => Object.assign({}, profile, loadingStates, errorStates),
    [profile, loadingStates, errorStates],
  );
}

export function useProfileCompleteness() {
  const {
    isProfileComplete: isComplete,
    missingFields,
    profileCompleteness: completionPercentage,
  } = useProfileStats();

  return useMemo(
    () => ({
      isComplete,
      missingFields,
      completionPercentage,
    }),
    [isComplete, missingFields, completionPercentage],
  );
}

export function useProfileDisplay() {
  return useProfileDisplayStore();
}


