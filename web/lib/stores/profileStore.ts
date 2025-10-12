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
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { 
  ProfileUser, 
  UserProfile, 
  ProfileUpdateData, 
  ProfilePreferences, 
  PrivacySettings,
  ProfileValidationResult,
  AvatarUploadResult,
  ProfileExportData
} from '@/features/profile/types';
import { withOptional } from '@/lib/utils/objects';

import type { BaseStore } from './types';


// Local type definition
interface ProfileCompleteness {
  isComplete: boolean;
  percentage: number;
  missingFields: string[];
}

// Profile store state interface
type ProfileStore = {
  // Profile data
  profile: ProfileUser | null;
  userProfile: UserProfile | null;
  
  // Profile state
  isProfileLoaded: boolean;
  isProfileComplete: boolean;
  profileCompleteness: number;
  missingFields: string[];
  
  // Loading states
  isProfileLoading: boolean;
  isUpdating: boolean;
  isUploadingAvatar: boolean;
  isExporting: boolean;
  
  // Validation state
  validationErrors: Record<string, string[]>;
  validationWarnings: Record<string, string[]>;
  
  // Profile preferences and settings
  preferences: ProfilePreferences | null;
  privacySettings: PrivacySettings | null;
  
  // Profile actions
  setProfile: (profile: ProfileUser | null) => void;
  setUserProfile: (userProfile: UserProfile | null) => void;
  updateProfile: (updates: ProfileUpdateData) => Promise<boolean>;
  updatePreferences: (preferences: Partial<ProfilePreferences>) => Promise<boolean>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<boolean>;
  
  // Avatar actions
  updateAvatar: (file: File) => Promise<AvatarUploadResult>;
  removeAvatar: () => Promise<boolean>;
  
  // Profile management
  loadProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  exportProfile: () => Promise<ProfileExportData | null>;
  deleteProfile: () => Promise<boolean>;
  
  // Validation
  validateProfile: (data: ProfileUpdateData) => ProfileValidationResult;
  setValidationErrors: (errors: Record<string, string[]>) => void;
  setValidationWarnings: (warnings: Record<string, string[]>) => void;
  clearValidation: () => void;
  
  // Loading states
  setProfileLoading: (loading: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setUploadingAvatar: (uploading: boolean) => void;
  setExporting: (exporting: boolean) => void;
  
  // Profile completeness
  updateProfileCompleteness: () => void;
  getProfileCompleteness: () => ProfileCompleteness;
  
  // Profile display helpers
  getDisplayName: () => string;
  getInitials: () => string;
  getTrustTierDisplay: () => string;
  isAdmin: () => boolean;
  
  // Reset and cleanup
  resetProfile: () => void;
  clearProfile: () => void;
} & BaseStore

// Create profile store with middleware
export const useProfileStore = create<ProfileStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        profile: null,
        userProfile: null,
        isProfileLoaded: false,
        isProfileComplete: false,
        profileCompleteness: 0,
        missingFields: [],
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
        
        // Base store actions
        setLoading: (loading) => set((state) => {
          state.isLoading = loading;
        }),
        
        setError: (error) => set((state) => {
          state.error = error;
        }),
        
        clearError: () => set((state) => {
          state.error = null;
        }),
        
        // Profile data actions
        setProfile: (profile) => set((state) => {
          state.profile = profile;
          state.isProfileLoaded = !!profile;
          if (profile) {
            state.updateProfileCompleteness();
          }
        }),
        
        setUserProfile: (userProfile) => set((state) => {
          state.userProfile = userProfile;
          if (userProfile) {
            state.preferences = userProfile.preferences as ProfilePreferences || null;
            state.privacySettings = userProfile.privacy_settings as PrivacySettings || null;
            state.updateProfileCompleteness();
          }
        }),
        
        // Profile update action
        updateProfile: async (updates) => {
          set((state) => {
            state.isUpdating = true;
            state.error = null;
          });
          
          try {
            // Import profile service dynamically to avoid circular dependencies
            const { updateProfile: updateProfileService } = await import('@/features/profile/lib/profile-service');
            const result = await updateProfileService(updates);
            
            if (result.success && result.data) {
              set((state) => {
                state.profile = result.data as ProfileUser;
                state.isUpdating = false;
                state.updateProfileCompleteness();
              });
              return true;
            } else {
              set((state) => {
                state.error = result.error || 'Failed to update profile';
                state.isUpdating = false;
              });
              return false;
            }
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to update profile';
              state.isUpdating = false;
            });
            return false;
          }
        },
        
        // Preferences update
        updatePreferences: async (preferences) => {
          set((state) => {
            state.isUpdating = true;
            state.error = null;
          });
          
          try {
            const { updateProfile } = await import('@/features/profile/lib/profile-service');
            const result = await updateProfile({ preferences });
            
            if (result.success) {
              set((state) => {
                if (state.preferences) {
                  state.preferences = withOptional(state.preferences, preferences);
                } else {
                  state.preferences = preferences;
                }
                state.isUpdating = false;
              });
              return true;
            } else {
              set((state) => {
                state.error = result.error || 'Failed to update preferences';
                state.isUpdating = false;
              });
              return false;
            }
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to update preferences';
              state.isUpdating = false;
            });
            return false;
          }
        },
        
        // Privacy settings update
        updatePrivacySettings: async (settings) => {
          set((state) => {
            state.isUpdating = true;
            state.error = null;
          });
          
          try {
            const { updateProfile } = await import('@/features/profile/lib/profile-service');
            const result = await updateProfile({ privacy_settings: settings as PrivacySettings });
            
            if (result.success) {
              set((state) => {
                if (state.privacySettings) {
                  state.privacySettings = withOptional(state.privacySettings, settings);
                } else {
                  state.privacySettings = settings as PrivacySettings;
                }
                state.isUpdating = false;
              });
              return true;
            } else {
              set((state) => {
                state.error = result.error || 'Failed to update privacy settings';
                state.isUpdating = false;
              });
              return false;
            }
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to update privacy settings';
              state.isUpdating = false;
            });
            return false;
          }
        },
        
        // Avatar actions
        updateAvatar: async (file) => {
          set((state) => {
            state.isUploadingAvatar = true;
            state.error = null;
          });
          
          try {
            const { updateProfileAvatar } = await import('@/features/profile/lib/profile-service');
            const result = await updateProfileAvatar(file);
            
            set((state) => {
              state.isUploadingAvatar = false;
            });
            
            if (result.success && result.avatar_url) {
              set((state) => {
                if (state.profile) {
                  state.profile.avatar_url = result.avatar_url;
                }
                if (state.userProfile) {
                  state.userProfile.avatar_url = result.avatar_url;
                }
              });
            }
            
            return result;
          } catch (error) {
            set((state) => {
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
          set((state) => {
            state.isUpdating = true;
            state.error = null;
          });
          
          try {
            const { updateProfile } = await import('@/features/profile/lib/profile-service');
            const currentState = get();
            const result = await updateProfile({ display_name: currentState.profile?.display_name } as ProfileUpdateData);
            
            if (result.success) {
              set((state) => {
                if (state.profile) {
                  state.profile.avatar_url = undefined;
                }
                if (state.userProfile) {
                  state.userProfile.avatar_url = undefined;
                }
                state.isUpdating = false;
              });
              return true;
            } else {
              set((state) => {
                state.error = result.error || 'Failed to remove avatar';
                state.isUpdating = false;
              });
              return false;
            }
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to remove avatar';
              state.isUpdating = false;
            });
            return false;
          }
        },
        
        // Profile management
        loadProfile: async () => {
          set((state) => {
            state.isProfileLoading = true;
            state.error = null;
          });
          
          try {
            const { getCurrentProfile } = await import('@/features/profile/lib/profile-service');
            const result = await getCurrentProfile();
            
            if (result.success && result.data) {
              set((state) => {
                state.profile = result.data as ProfileUser;
                state.isProfileLoaded = true;
                state.isProfileLoading = false;
                state.updateProfileCompleteness();
              });
            } else {
              set((state) => {
                state.error = result.error || 'Failed to load profile';
                state.isProfileLoading = false;
              });
            }
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to load profile';
              state.isProfileLoading = false;
            });
          }
        },
        
        refreshProfile: async () => {
          await get().loadProfile();
        },
        
        exportProfile: async () => {
          set((state) => {
            state.isExporting = true;
            state.error = null;
          });
          
          try {
            const { exportUserData } = await import('@/features/profile/lib/profile-service');
            const result = await exportUserData();
            
            set((state) => {
              state.isExporting = false;
            });
            
            return result;
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to export profile';
              state.isExporting = false;
            });
            return null;
          }
        },
        
        deleteProfile: async () => {
          set((state) => {
            state.isUpdating = true;
            state.error = null;
          });
          
          try {
            const { deleteProfile } = await import('@/features/profile/lib/profile-service');
            const result = await deleteProfile();
            
            if (result.success) {
              set((state) => {
                state.profile = null;
                state.userProfile = null;
                state.isProfileLoaded = false;
                state.isProfileComplete = false;
                state.profileCompleteness = 0;
                state.missingFields = [];
                state.isUpdating = false;
              });
              return true;
            } else {
              set((state) => {
                state.error = result.error || 'Failed to delete profile';
                state.isUpdating = false;
              });
              return false;
            }
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to delete profile';
              state.isUpdating = false;
            });
            return false;
          }
        },
        
        // Validation
        validateProfile: (data) => {
          // Basic validation logic
          const errors: string[] = [];
          const warnings: string[] = [];
          
          if (data.display_name && data.display_name.length < 2) {
            errors.push('Display name must be at least 2 characters');
          }
          
          if (data.bio && data.bio.length > 500) {
            warnings.push('Bio is quite long, consider shortening it');
          }
          
          return {
            isValid: errors.length === 0,
            errors,
            warnings
          };
        },
        
        setValidationErrors: (errors) => set((state) => {
          state.validationErrors = errors;
        }),
        
        setValidationWarnings: (warnings) => set((state) => {
          state.validationWarnings = warnings;
        }),
        
        clearValidation: () => set((state) => {
          state.validationErrors = {};
          state.validationWarnings = {};
        }),
        
        // Loading states
        setProfileLoading: (loading) => set((state) => {
          state.isProfileLoading = loading;
        }),
        
        setUpdating: (updating) => set((state) => {
          state.isUpdating = updating;
        }),
        
        setUploadingAvatar: (uploading) => set((state) => {
          state.isUploadingAvatar = uploading;
        }),
        
        setExporting: (exporting) => set((state) => {
          state.isExporting = exporting;
        }),
        
        // Profile completeness
        updateProfileCompleteness: () => {
          const state = get();
          const profile = state.profile || state.userProfile;
          
          if (!profile) {
            set((state) => {
              state.isProfileComplete = false;
              state.profileCompleteness = 0;
              state.missingFields = [];
            });
            return;
          }
          
          const requiredFields = ['display_name', 'username', 'email'];
          const missingFields: string[] = [];
          
          requiredFields.forEach(field => {
            if (!profile[field as keyof typeof profile] || 
                (typeof profile[field as keyof typeof profile] === 'string' && 
                 (profile[field as keyof typeof profile] as string).trim().length === 0)) {
              missingFields.push(field.replace('_', ' '));
            }
          });
          
          const isComplete = missingFields.length === 0;
          const percentage = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100);
          
          set((state) => {
            state.isProfileComplete = isComplete;
            state.profileCompleteness = percentage;
            state.missingFields = missingFields;
          });
        },
        
        getProfileCompleteness: () => {
          const state = get();
          return {
            isComplete: state.isProfileComplete,
            percentage: state.profileCompleteness,
            missingFields: state.missingFields
          };
        },
        
        // Profile display helpers
        getDisplayName: () => {
          const state = get();
          const profile = state.profile || state.userProfile;
          if (!profile) return 'User';
          return profile.display_name || profile.username || profile.email?.split('@')[0] || 'User';
        },
        
        getInitials: () => {
          const state = get();
          const displayName = state.getDisplayName();
          return displayName
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
        },
        
        getTrustTierDisplay: () => {
          const state = get();
          const profile = state.profile || state.userProfile;
          if (!profile) return 'Unknown';
          
          const tierNames: Record<string, string> = {
            'T0': 'New User',
            'T1': 'Verified User',
            'T2': 'Trusted User',
            'T3': 'VIP User',
          };
          return tierNames[profile.trust_tier] || 'Unknown';
        },
        
        isAdmin: () => {
          const state = get();
          const profile = state.profile || state.userProfile;
          return profile?.is_admin || false;
        },
        
        // Reset and cleanup
        resetProfile: () => set((state) => {
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
          get().resetProfile();
        }
      })),
      {
        name: 'profile-store',
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
    {
      name: 'profile-store'
    }
  )
);

// Profile store selectors for common use cases
export const profileSelectors = {
  // Basic profile data
  profile: (state: ProfileStore) => state.profile,
  userProfile: (state: ProfileStore) => state.userProfile,
  
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
  
  // Validation
  validationErrors: (state: ProfileStore) => state.validationErrors,
  validationWarnings: (state: ProfileStore) => state.validationWarnings,
  hasValidationErrors: (state: ProfileStore) => Object.keys(state.validationErrors).length > 0,
  hasValidationWarnings: (state: ProfileStore) => Object.keys(state.validationWarnings).length > 0
};

// Profile store hooks for common patterns
export const useProfile = () => useProfileStore((state) => ({
  profile: state.profile,
  userProfile: state.userProfile,
  isProfileLoaded: state.isProfileLoaded,
  isProfileComplete: state.isProfileComplete,
  profileCompleteness: state.profileCompleteness,
  missingFields: state.missingFields
}));

export const useProfileLoading = () => useProfileStore((state) => ({
  isLoading: state.isProfileLoading,
  isUpdating: state.isUpdating,
  isUploadingAvatar: state.isUploadingAvatar,
  isExporting: state.isExporting
}));

export const useProfileError = () => useProfileStore((state) => ({
  error: state.error,
  hasError: !!state.error
}));

export const useProfileDisplay = () => useProfileStore((state) => ({
  displayName: state.getDisplayName(),
  initials: state.getInitials(),
  trustTierDisplay: state.getTrustTierDisplay(),
  isAdmin: state.isAdmin()
}));

export const useProfileValidation = () => useProfileStore((state) => ({
  validationErrors: state.validationErrors,
  validationWarnings: state.validationWarnings,
  hasValidationErrors: Object.keys(state.validationErrors).length > 0,
  hasValidationWarnings: Object.keys(state.validationWarnings).length > 0
}));

export const useProfileActions = () => useProfileStore((state) => ({
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
}));

export const useProfileStats = () => useProfileStore((state) => ({
  isProfileLoaded: state.isProfileLoaded,
  isProfileComplete: state.isProfileComplete,
  profileCompleteness: state.profileCompleteness,
  missingFields: state.missingFields,
  hasPreferences: !!state.preferences,
  hasPrivacySettings: !!state.privacySettings
}));

// Profile store utilities
export const profileStoreUtils = {
  // Initialize profile store
  initialize: () => {
    console.log('Profile store initialized');
  },
  
  // Reset profile store
  reset: () => {
    useProfileStore.getState().resetProfile();
    console.log('Profile store reset');
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
    console.log('Profile Store State:', {
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
    console.log('Profile store cleared');
  }
};
