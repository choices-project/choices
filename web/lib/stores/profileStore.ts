/**
 * Profile Store - Zustand Implementation
 *
 * Comprehensive profile state management with Zustand integration
 * Handles profile data, preferences, settings, and real-time updates
 *
 * Created: December 19, 2024
 * Status: ✅ INTEGRATED
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

import { logger } from '@/lib/utils/logger';


import { createBaseStoreActions } from './baseStoreActions';
import { createSafeStorage } from './storage';

import type { BaseStore } from './types';
import type {
  AvatarUploadResult,
  ExportOptions,
  PrivacySettings,
  ProfileActionResult,
  ProfileDemographics,
  ProfileExportData,
  ProfileLocation,
  ProfilePreferences,
  ProfileUpdateData,
  ProfileUser,
  ProfileValidationResult,
  UserProfile
} from '@/types/profile';
import type { StateCreator } from 'zustand';

// Stable empty array references to prevent unnecessary re-renders
const EMPTY_STRING_ARRAY: string[] = [];

export type ProfileCompleteness = {
  isComplete: boolean;
  percentage: number;
  missingFields: string[];
};

export type ProfileState = {
  profile: ProfileUser | null;
  userProfile: UserProfile | null;

  isProfileLoaded: boolean;
  isProfileComplete: boolean;
  profileCompleteness: number;
  missingFields: string[];

  isLoading: boolean;
  isProfileLoading: boolean;
  isUpdating: boolean;
  isUploadingAvatar: boolean;
  isExporting: boolean;
  error: string | null;

  validationErrors: Record<string, string[]>;
  validationWarnings: Record<string, string[]>;

  preferences: ProfilePreferences | null;
  privacySettings: PrivacySettings | null;
};

export type ProfileActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  setProfile: (profile: ProfileUser | null) => void;
  setUserProfile: (userProfile: UserProfile | null) => void;

  updateProfile: (updates: ProfileUpdateData) => Promise<ProfileActionResult>;
  updatePreferences: (preferences: Partial<ProfilePreferences>) => Promise<boolean>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<boolean>;

  updateAvatar: (file: File) => Promise<AvatarUploadResult>;
  removeAvatar: () => Promise<boolean>;

  loadProfile: () => Promise<ProfileActionResult>;
  refreshProfile: () => Promise<ProfileActionResult>;
  exportProfile: (options?: ExportOptions) => Promise<ProfileExportData | null>;
  deleteProfile: () => Promise<ProfileActionResult>;

  validateProfile: (data: ProfileUpdateData) => ProfileValidationResult;
  setValidationErrors: (errors: Record<string, string[]>) => void;
  setValidationWarnings: (warnings: Record<string, string[]>) => void;
  clearValidation: () => void;

  setProfileLoading: (loading: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setUploadingAvatar: (uploading: boolean) => void;
  setExporting: (exporting: boolean) => void;

  updateProfileCompleteness: () => void;
  getProfileCompleteness: () => ProfileCompleteness;

  getDisplayName: () => string;
  getInitials: () => string;
  getTrustTierDisplay: () => string;
  isAdmin: () => boolean;

  resetProfile: () => void;
  clearProfile: () => void;
};

export type ProfileStore = ProfileState & ProfileActions;

type ProfileStoreCreator = StateCreator<
  ProfileStore,
  [['zustand/devtools', never], ['zustand/persist', unknown], ['zustand/immer', never]]
>;

export const createInitialProfileState = (): ProfileState => ({
  profile: null,
  userProfile: null,
  isProfileLoaded: false,
  isProfileComplete: false,
  profileCompleteness: 0,
  missingFields: EMPTY_STRING_ARRAY,
  isLoading: false,
  isProfileLoading: false,
  isUpdating: false,
  isUploadingAvatar: false,
  isExporting: false,
  error: null,
  validationErrors: {},
  validationWarnings: {},
  preferences: null,
  privacySettings: null,
});

export const initialProfileState: ProfileState = createInitialProfileState();

type ImmerProfileSetter = (recipe: (draft: ProfileStore) => void) => void;

export const createProfileActions = (
  setState: ImmerProfileSetter,
  getState: () => ProfileStore
): ProfileActions => {
  const actions = {
    ...createBaseStoreActions<ProfileStore>(setState),

    setProfile: (profile: ProfileUser | null) => setState((state) => {
      state.profile = profile;
      state.isProfileLoaded = !!profile;
    }),

    setUserProfile: (userProfile: UserProfile | null) => setState((state) => {
      state.userProfile = userProfile;

      if (userProfile) {
        state.preferences = ('preferences' in userProfile ? userProfile.preferences : null) as ProfilePreferences | null;
        state.privacySettings = ('privacy_settings' in userProfile ? userProfile.privacy_settings : null) as PrivacySettings | null;
      }
    }),

    updateProfile: async (updates: ProfileUpdateData) => {
      setState((state) => {
        state.isUpdating = true;
        state.error = null;
      });

      try {
        const { updateProfile: updateProfileService } = await import('@/features/profile/lib/profile-service');
        const result = await updateProfileService(updates);

        setState((state) => {
          state.isUpdating = false;
          if (result.success && result.data) {
            state.profile = result.data ?? null;
            state.isProfileLoaded = true;
          } else if (result.error) {
            state.error = result.error;
          } else {
            state.error = 'Failed to update profile';
          }
        });

        if (result.success) {
          getState().updateProfileCompleteness();
        }

        return result;
      } catch (error) {
        setState((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update profile';
          state.isUpdating = false;
        });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update profile'
        };
      }
    },

    updatePreferences: async (preferences: Partial<ProfilePreferences>) => {
      setState((state) => {
        state.isUpdating = true;
        state.error = null;
      });

      try {
        // Update preferences via POST /api/profile with body.preferences
        // The API expects preferences in body.preferences and stores them in privacy_settings
        const response = await fetch('/api/profile', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preferences: preferences,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to update preferences' }));
          throw new Error(errorData.error ?? `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success !== false) {
          // Update local store state with merged preferences
          setState((state) => {
            if (state.preferences) {
              Object.assign(state.preferences, preferences);
            } else {
              state.preferences = preferences as ProfilePreferences;
            }
            state.isUpdating = false;
          });
          return true;
        }

        setState((state) => {
          state.error = result.error ?? 'Failed to update preferences';
          state.isUpdating = false;
        });
        return false;
      } catch (error) {
        setState((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update preferences';
          state.isUpdating = false;
        });
        return false;
      }
    },

    updatePrivacySettings: async (settings: Partial<PrivacySettings>) => {
      setState((state) => {
        state.isUpdating = true;
        state.error = null;
      });

      try {
        const { updateProfile } = await import('@/features/profile/lib/profile-service');
        const result = await updateProfile({ privacy_settings: settings as PrivacySettings });

        if (result.success) {
          setState((state) => {
            const existing = state.privacySettings ?? {};
            state.privacySettings = {
              ...(existing as Record<string, unknown>),
              ...(settings as Record<string, unknown>),
            } as PrivacySettings;
            state.isUpdating = false;
          });
          return true;
        }

        setState((state) => {
          state.error = result.error ?? 'Failed to update privacy settings';
          state.isUpdating = false;
        });
        return false;
      } catch (error) {
        setState((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update privacy settings';
          state.isUpdating = false;
        });
        return false;
      }
    },

    updateAvatar: async (file: File) => {
      setState((state) => {
        state.isUploadingAvatar = true;
        state.error = null;
      });

      try {
        const { updateProfileAvatar } = await import('@/features/profile/lib/profile-service');
        const result = await updateProfileAvatar(file);

        setState((state) => {
          state.isUploadingAvatar = false;
        });

        if (result.success && result.url) {
          setState((state) => {
            if (state.profile && 'avatar_url' in state.profile) {
              state.profile.avatar_url = result.url ?? null;
            }
            if (state.userProfile && 'avatar_url' in state.userProfile) {
              state.userProfile.avatar_url = result.url ?? null;
            }
          });
        }

        return result;
      } catch (error) {
        setState((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update avatar';
          state.isUploadingAvatar = false;
        });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update avatar'
        };
      }
    },

    removeAvatar: async () => {
      setState((state) => {
        state.isUpdating = true;
        state.error = null;
      });

      try {
        const { updateProfile } = await import('@/features/profile/lib/profile-service');
        const currentState = getState();
        const result = await updateProfile({ display_name: currentState.profile?.display_name } as ProfileUpdateData);

        if (result.success) {
          setState((state) => {
            if (state.profile && 'avatar_url' in state.profile) {
              state.profile.avatar_url = null;
            }
            if (state.userProfile && 'avatar_url' in state.userProfile) {
              state.userProfile.avatar_url = null;
            }
            state.isUpdating = false;
          });
          return true;
        }

        setState((state) => {
          state.error = result.error ?? 'Failed to remove avatar';
          state.isUpdating = false;
        });
        return false;
      } catch (error) {
        setState((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to remove avatar';
          state.isUpdating = false;
        });
        return false;
      }
    },

    loadProfile: async () => {
      // #region agent log
      if (process.env.NODE_ENV === 'development') {
        // Debug logging removed for production
      }
      // #endregion
      setState((state) => {
        state.isProfileLoading = true;
        state.error = null;
      });

      try {
        const { getCurrentProfile } = await import('@/features/profile/lib/profile-service');

        // Add timeout wrapper to ensure we don't hang forever
        const timeoutPromise = new Promise<ProfileActionResult>((resolve) => {
          setTimeout(() => {
            resolve({
              success: false,
              error: 'Profile loading timed out after 30 seconds',
            });
          }, 30_000);
        });

        // #region agent log
        if (process.env.NODE_ENV === 'development') {
          // Debug logging removed for production
        }
        // #endregion
        const result = await Promise.race([
          getCurrentProfile(),
          timeoutPromise,
        ]);
        // #region agent log
        if (process.env.NODE_ENV === 'development') {
          // Debug logging removed for production
        }
        // #endregion

        setState((state) => {
          state.isProfileLoading = false;
          // #region agent log
          if (process.env.NODE_ENV === 'development') {
            // Debug logging removed for production
          }
          // #endregion
          if (result.success && result.data) {
            state.profile = result.data ?? null;
            state.isProfileLoaded = true;
            // Also set userProfile and preferences from API response
            if (result.data) {
              state.userProfile = result.data;
              // Set preferences from API response if available
              if (result.preferences) {
                state.preferences = result.preferences;
              }
            }
            // #region agent log
            if (process.env.NODE_ENV === 'development') {
              // Debug logging removed for production
            }
            // #endregion
          } else if (result.error) {
            state.error = result.error;
            // #region agent log
            if (process.env.NODE_ENV === 'development') {
              // Debug logging removed for production
            }
            // #endregion
            // If we get a 401 (Unauthorized), mark as loaded to prevent infinite retry loops
            // This prevents the useEffect from continuously retrying when user is not authenticated
            if (result.error.includes('401') || result.error.includes('Unauthorized')) {
              state.isProfileLoaded = true; // Mark as "loaded" (even though failed) to stop retries
            }
            // Don't set isProfileLoaded to false if we have a cached profile
            // This allows pages to render with cached data even if refresh fails
          } else {
            state.error = 'Failed to load profile';
            // #region agent log
            if (process.env.NODE_ENV === 'development') {
              // Debug logging removed for production
            }
            // #endregion
          }
        });

        if (result.success) {
          getState().updateProfileCompleteness();
        }

        return result;
      } catch (error) {
        // #region agent log
        if (process.env.NODE_ENV === 'development') {
          // Debug logging removed for production
        }
        // #endregion
        setState((state) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
          state.error = errorMessage;
          state.isProfileLoading = false;
          // If we get a 401 (Unauthorized), mark as loaded to prevent infinite retry loops
          if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            state.isProfileLoaded = true; // Mark as "loaded" (even though failed) to stop retries
          }
          // If we have a cached profile, don't clear it on error
          // This allows pages to render with stale data rather than showing error
        });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load profile'
        };
      }
    },

    refreshProfile: async () => {
      return getState().loadProfile();
    },

    exportProfile: async (options?: ExportOptions) => {
      setState((state) => {
        state.isExporting = true;
        state.error = null;
      });

      try {
        const { exportUserData } = await import('@/features/profile/lib/profile-service');
        const result = await exportUserData(options);

        setState((state) => {
          state.isExporting = false;
        });

        return result;
      } catch (error) {
        setState((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to export profile';
          state.isExporting = false;
        });
        return null;
      }
    },

    deleteProfile: async () => {
      setState((state) => {
        state.isUpdating = true;
        state.error = null;
      });

      try {
        const { deleteProfile } = await import('@/features/profile/lib/profile-service');
        const result = await deleteProfile();

        if (result.success) {
          setState((state) => {
            state.profile = null;
            state.userProfile = null;
            state.isProfileLoaded = false;
            state.isProfileComplete = false;
            state.profileCompleteness = 0;
            state.missingFields = [];
            state.isUpdating = false;
          });
          return result;
        }

        setState((state) => {
          state.error = result.error ?? 'Failed to delete profile';
          state.isUpdating = false;
        });
        return result;
      } catch (error) {
        setState((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to delete profile';
          state.isUpdating = false;
        });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete profile'
        };
      }
    },

    validateProfile: (data: ProfileUpdateData) => {
      const errors: Record<string, string> = {};
      const warnings: Record<string, string> = {};

      if (data.display_name && data.display_name.length < 2) {
        errors.display_name = 'Display name must be at least 2 characters';
      }

      if (data.bio && data.bio.length > 500) {
        warnings.bio = 'Bio is quite long, consider shortening it';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings
      };
    },

    setValidationErrors: (errors: Record<string, string[]>) => setState((state) => {
      state.validationErrors = errors;
    }),

    setValidationWarnings: (warnings: Record<string, string[]>) => setState((state) => {
      state.validationWarnings = warnings;
    }),

    clearValidation: () => setState((state) => {
      state.validationErrors = {};
      state.validationWarnings = {};
    }),

    setProfileLoading: (loading: boolean) => setState((state) => {
      state.isProfileLoading = loading;
    }),

    setUpdating: (updating: boolean) => setState((state) => {
      state.isUpdating = updating;
    }),

    setUploadingAvatar: (uploading: boolean) => setState((state) => {
      state.isUploadingAvatar = uploading;
    }),

    setExporting: (exporting: boolean) => setState((state) => {
      state.isExporting = exporting;
    }),

    updateProfileCompleteness: () => {
      const state = getState();
      const profile = state.profile ?? state.userProfile;

      if (!profile) {
        setState((draft) => {
          draft.isProfileComplete = false;
          draft.profileCompleteness = 0;
          draft.missingFields = [];
        });
        return;
      }

      const requiredFields = ['display_name', 'username', 'email'] as const;
      const missingFields: string[] = [];

      requiredFields.forEach((field) => {
        const value = profile[field as keyof typeof profile];
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          missingFields.push(field.replace('_', ' '));
        }
      });

      const isComplete = missingFields.length === 0;
      const percentage = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100);

      setState((draft) => {
        draft.isProfileComplete = isComplete;
        draft.profileCompleteness = percentage;
        draft.missingFields = missingFields;
      });
    },

    getProfileCompleteness: () => {
      const state = getState();
      return {
        isComplete: state.isProfileComplete,
        percentage: state.profileCompleteness,
        missingFields: state.missingFields
      };
    },

    getDisplayName: () => {
      const state = getState();
      const profile = state.profile ?? state.userProfile;
      if (!profile) return 'User';
      return profile.display_name ?? profile.username ?? profile.email?.split('@')[0] ?? 'User';
    },

    getInitials: () => {
      const displayName = getState().getDisplayName();
      return displayName
        .split(' ')
        .map((word: string) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    },

    getTrustTierDisplay: () => {
      const profile = getState().profile ?? getState().userProfile;
      if (!profile) return 'Unknown';

      const tierNames: Record<string, string> = {
        T0: 'New User',
        T1: 'Verified User',
        T2: 'Trusted User',
        T3: 'Guardian',
        T4: 'Sentinel',
      };

      return tierNames[profile.trust_tier ?? ''] ?? 'Unknown';
    },

    isAdmin: () => {
      const profile = getState().profile ?? getState().userProfile;
      return (profile && 'is_admin' in profile) ? profile.is_admin ?? false : false;
    },

    resetProfile: () => setState((state) => {
      state.profile = null;
      state.userProfile = null;
      state.isProfileLoaded = false;
      state.isProfileComplete = false;
      state.profileCompleteness = 0;
      state.missingFields = [];
      state.preferences = null;
      state.privacySettings = null;
      state.validationErrors = {};
      state.validationWarnings = {};
    }),

    clearProfile: () => {
      getState().resetProfile();
    }
  } satisfies ProfileActions;

  return actions;
};

export const profileStoreCreator: ProfileStoreCreator = (set, get) => {
  const setState = set as unknown as ImmerProfileSetter;
  return {
    ...createInitialProfileState(),
    ...createProfileActions(setState, get)
  };
};

export const useProfileStore = create<ProfileStore>()(
  devtools(
    persist(
      immer(profileStoreCreator),
      {
        name: 'profile-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          profile: state.profile,
          userProfile: state.userProfile,
          preferences: state.preferences,
          privacySettings: state.privacySettings,
          isProfileLoaded: state.isProfileLoaded,
          isProfileComplete: state.isProfileComplete,
          profileCompleteness: state.profileCompleteness
        })
      }
    ),
    { name: 'profile-store' }
  )
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const coerceDemographics = (value: unknown): ProfileDemographics | null => {
  if (!isRecord(value)) {
    return null;
  }
  return value as ProfileDemographics;
};

const coerceLocation = (value: unknown): ProfileLocation | null => {
  if (!isRecord(value)) {
    return null;
  }
  return value as ProfileLocation;
};

// Profile store selectors for common use cases
export const profileSelectors = {
  // Basic profile data
  profile: (state: ProfileStore) => state.profile,
  userProfile: (state: ProfileStore) => state.userProfile,
  currentProfile: (state: ProfileStore) => state.profile ?? state.userProfile,

  // Profile state
  isProfileLoaded: (state: ProfileStore) => state.isProfileLoaded,
  isProfileComplete: (state: ProfileStore) => state.isProfileComplete,
  profileCompleteness: (state: ProfileStore) => state.profileCompleteness,
  missingFields: (state: ProfileStore) => state.missingFields,

  // Loading states
  isLoading: (state: ProfileStore) => state.isProfileLoading || state.isUpdating,
  isUpdating: (state: ProfileStore) => state.isUpdating,
  isUploadingAvatar: (state: ProfileStore) => state.isUploadingAvatar,
  isExporting: (state: ProfileStore) => state.isExporting,

  // Error states
  hasError: (state: ProfileStore) => !!state.error,
  error: (state: ProfileStore) => state.error,

  // Profile display
  displayName: (state: ProfileStore) => state.getDisplayName(),
  initials: (state: ProfileStore) => state.getInitials(),
  trustTierDisplay: (state: ProfileStore) => state.getTrustTierDisplay(),
  isAdmin: (state: ProfileStore) => state.isAdmin(),

  // Preferences and settings
  preferences: (state: ProfileStore) => state.preferences,
  privacySettings: (state: ProfileStore) => state.privacySettings,
  demographics: (state: ProfileStore) => {
    return (
      coerceDemographics(state.profile?.demographics) ??
      coerceDemographics(state.userProfile?.demographics) ??
      null
    );
  },
  location: (state: ProfileStore) => {
    const demographics =
      coerceDemographics(state.profile?.demographics) ??
      coerceDemographics(state.userProfile?.demographics);

    if (!demographics) {
      return null;
    }

    return coerceLocation(demographics.location) ?? null;
  },

  // Validation
  validationErrors: (state: ProfileStore) => state.validationErrors,
  validationWarnings: (state: ProfileStore) => state.validationWarnings,
  hasValidationErrors: (state: ProfileStore) => Object.keys(state.validationErrors).length > 0,
  hasValidationWarnings: (state: ProfileStore) => Object.keys(state.validationWarnings).length > 0
};

// Profile store hooks for common patterns
// Using useShallow to ensure stable object references
export const useProfile = () => useProfileStore(
  useShallow((state) => ({
    profile: state.profile,
    userProfile: state.userProfile,
    isProfileLoaded: state.isProfileLoaded,
    isProfileComplete: state.isProfileComplete,
    profileCompleteness: state.profileCompleteness,
    missingFields: state.missingFields
  }))
);

export const useProfileLoading = () => useProfileStore(
  useShallow((state) => ({
    isLoading: state.isProfileLoading,
    isUpdating: state.isUpdating,
    isUploadingAvatar: state.isUploadingAvatar,
    isExporting: state.isExporting
  }))
);

export const useProfileError = () => useProfileStore(
  useShallow((state) => ({
    error: state.error,
    hasError: !!state.error
  }))
);

export const useProfileDisplay = () => useProfileStore(
  useShallow((state) => ({
    displayName: state.getDisplayName(),
    initials: state.getInitials(),
    trustTierDisplay: state.getTrustTierDisplay(),
    isAdmin: state.isAdmin()
  }))
);

export const useProfileValidation = () => useProfileStore(
  useShallow((state) => ({
    validationErrors: state.validationErrors,
    validationWarnings: state.validationWarnings,
    hasValidationErrors: Object.keys(state.validationErrors).length > 0,
    hasValidationWarnings: Object.keys(state.validationWarnings).length > 0
  }))
);

export const useProfileActions = () => useProfileStore(
  useShallow((state) => ({
    updateProfile: state.updateProfile,
    updatePreferences: state.updatePreferences,
    updatePrivacySettings: state.updatePrivacySettings,
    updateAvatar: state.updateAvatar,
    removeAvatar: state.removeAvatar,
    loadProfile: state.loadProfile,
    refreshProfile: state.refreshProfile,
    exportProfile: state.exportProfile,
    deleteProfile: state.deleteProfile,
    validateProfile: state.validateProfile,
    setValidationErrors: state.setValidationErrors,
    clearValidation: state.clearValidation
  }))
);

export const useProfileStats = () => useProfileStore(
  useShallow((state) => ({
    isProfileLoaded: state.isProfileLoaded,
    isProfileComplete: state.isProfileComplete,
    profileCompleteness: state.profileCompleteness,
    missingFields: state.missingFields,
    hasPreferences: !!state.preferences,
    hasPrivacySettings: !!state.privacySettings
  }))
);

// Profile store utilities
export const profileStoreUtils = {
  // Initialize profile store
  initialize: () => {
    logger.info('Profile store initialized');
  },

  // Reset profile store
  reset: () => {
    useProfileStore.getState().resetProfile();
    logger.info('Profile store reset');
  },

  // Get profile completeness
  getCompleteness: () => {
    return useProfileStore.getState().getProfileCompleteness();
  },

  // Validate profile data
  validate: (data: ProfileUpdateData) => {
    return useProfileStore.getState().validateProfile(data);
  },

  // Get profile display info
  getDisplayInfo: () => {
    const state = useProfileStore.getState();
    return {
      displayName: state.getDisplayName(),
      initials: state.getInitials(),
      trustTier: state.getTrustTierDisplay(),
      isAdmin: state.isAdmin()
    };
  }
};

// Profile store subscriptions
export const profileStoreSubscriptions = {
  // Subscribe to profile changes
  onProfileChange: (callback: (profile: ProfileUser | null) => void) => {
    return useProfileStore.subscribe(
      (state, prevState) => {
        if (state.profile !== prevState.profile) {
          callback(state.profile);
        }
      }
    );
  },

  // Subscribe to profile completeness changes
  onCompletenessChange: (callback: (completeness: ProfileCompleteness) => void) => {
    return useProfileStore.subscribe(
      (state, prevState) => {
        const current = state.getProfileCompleteness();
        const previous = prevState.getProfileCompleteness();
        if (current !== previous) {
          callback(current);
        }
      }
    );
  },

  // Subscribe to loading state changes
  onLoadingChange: (callback: (isLoading: boolean) => void) => {
    return useProfileStore.subscribe(
      (state, prevState) => {
        const current = state.isProfileLoading || state.isUpdating;
        const previous = prevState.isProfileLoading || prevState.isUpdating;
        if (current !== previous) {
          callback(current);
        }
      }
    );
  }
};

// Profile store debugging
export const profileStoreDebug = {
  // Log current state
  logState: () => {
    const state = useProfileStore.getState();
    logger.debug('Profile Store State', {
      profile: state.profile,
      isProfileLoaded: state.isProfileLoaded,
      isProfileComplete: state.isProfileComplete,
      profileCompleteness: state.profileCompleteness,
      isLoading: state.isProfileLoading,
      isUpdating: state.isUpdating,
      error: state.error
    });
  },

  // Reset store
  reset: () => {
    profileStoreUtils.reset();
  },

  // Clear all data
  clearAll: () => {
    useProfileStore.getState().clearProfile();
    logger.info('Profile store cleared');
  }
};
