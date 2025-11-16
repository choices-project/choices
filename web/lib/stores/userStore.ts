/**
 * User Store - Zustand Implementation
 *
 * Centralized user state management including authentication, profile,
 * preferences, and settings. Consolidates AuthContext and user-related state.
 *
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import type { User, Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { logger } from '@/lib/utils/logger';
import type {
  UserProfile,
  ProfileUpdateData as ProfileUpdateDataType,
  PrivacySettings,
} from '@/types/profile';
import type { Representative } from '@/types/representative';
import type { Database } from '@/types/supabase';

import { useAdminStore } from './adminStore';
import { createBaseStoreActions } from './baseStoreActions';
import { useProfileStore } from './profileStore';
import { createSafeStorage } from './storage';
import type { BaseStore } from './types';

// Re-export types for convenience
export type ProfileUpdateData = ProfileUpdateDataType;
export type ProfileEditDraft = ProfileUpdateData;
export type PrivacySettingKey = keyof NonNullable<ProfileEditDraft['privacy_settings']>;
export type PrivacySettingValue<K extends PrivacySettingKey> =
  NonNullable<ProfileEditDraft['privacy_settings']>[K];
export type UserProfileUpdatePayload = Partial<UserProfile>;
export type ProfileEditErrorKey =
  | keyof ProfileEditDraft
  | `privacy_settings.${PrivacySettingKey}`
  | `demographics.${string}`
  | 'avatar'
  | 'global';
export type ProfileEditErrorMap = Partial<Record<ProfileEditErrorKey, string>>;

export type SupabaseUserProfileRow = Database['public']['Tables']['user_profiles']['Row'];

const mapProfileRowToUserProfile = (
  row: SupabaseUserProfileRow | UserProfile | null | undefined,
): UserProfile | null => {
  if (!row) return null;
  return {
    ...row,
  };
};

export const fromSupabaseProfileRow = mapProfileRowToUserProfile;

const assignDefined = <T extends object>(
  target: T,
  updates: Partial<T> | undefined
) => {
  if (!updates) return;
  const record = target as Record<keyof T, unknown>;
  (Object.entries(updates) as [keyof T, T[keyof T]][]).forEach(([key, value]) => {
    if (value !== undefined) {
      record[key] = value as unknown;
    }
  });
};

const cascadeDependentStoreReset = () => {
  try {
    useProfileStore.getState().resetProfile();
  } catch (error) {
    logger.warn('Failed to reset profile store during auth cascade', error);
  }

  try {
    useAdminStore.getState().resetAdminState();
  } catch (error) {
    logger.warn('Failed to reset admin store during auth cascade', error);
  }
};

// User store state interface
export type UserState = {
  // Authentication state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;

  // User profile data
  profile: UserProfile | null;

  // Profile editing state
  profileEditData: ProfileEditDraft | null;
  isProfileEditing: boolean;
  profileEditErrors: ProfileEditErrorMap;

  // Address and representatives
  currentAddress: string;
  currentState: string;
  representatives: Representative[];
  showAddressForm: boolean;
  newAddress: string;
  addressLoading: boolean;
  savedSuccessfully: boolean;

  // Avatar editing
  avatarFile: File | null;
  avatarPreview: string | null;
  isUploadingAvatar: boolean;

  // Biometric state
  biometric: {
    isSupported: boolean | null;
    isAvailable: boolean | null;
    hasCredentials: boolean | null;
    isRegistering: boolean;
    error: string | null;
    success: boolean;
  };

  // Loading states
  isProfileLoading: boolean;
  isUpdating: boolean;

  // Base state
  isLoading: boolean;
  error: string | null;
};

export type UserActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  // Actions - Authentication
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setUserAndAuth: (user: User | null, authenticated: boolean) => void;
  setSessionAndDerived: (session: Session | null) => void;
  initializeAuth: (user: User | null, session: Session | null, authenticated: boolean) => void;
  signOut: () => void;
  clearUser: () => void;

  // Actions - Profile Editing
  setProfileEditData: (data: ProfileEditDraft | null) => void;
  updateProfileEditData: (updates: Partial<ProfileUpdateData>) => void;
  updateProfileField: (field: keyof ProfileEditDraft, value: ProfileEditDraft[keyof ProfileEditDraft]) => void;
  updateArrayField: (field: 'primary_concerns' | 'community_focus', value: string) => void;
  updatePrivacySetting: <K extends PrivacySettingKey>(
    setting: K,
    value: PrivacySettingValue<K>
  ) => void;
  setProfileEditing: (editing: boolean) => void;
  setProfileEditError: (field: ProfileEditErrorKey, error: string) => void;
  clearProfileEditError: (field: ProfileEditErrorKey) => void;
  clearAllProfileEditErrors: () => void;

  // Actions - Address and Representatives
  setCurrentAddress: (address: string) => void;
  setCurrentState: (state: string) => void;
  setRepresentatives: (representatives: Representative[]) => void;
  addRepresentative: (representative: Representative) => void;
  removeRepresentative: (id: string) => void;
  setShowAddressForm: (show: boolean) => void;
  setNewAddress: (address: string) => void;
  setAddressLoading: (loading: boolean) => void;
  setSavedSuccessfully: (saved: boolean) => void;
  lookupAddress: (address: string) => Promise<Representative[]>;
  handleAddressUpdate: (address: string, temporary?: boolean) => Promise<void>;

  // Actions - Avatar
  setAvatarFile: (file: File | null) => void;
  setAvatarPreview: (preview: string | null) => void;
  setUploadingAvatar: (uploading: boolean) => void;
  clearAvatar: () => void;

  // Actions - Profile
  setProfile: (profile: SupabaseUserProfileRow | UserProfile | null) => void;
  updateProfile: (updates: UserProfileUpdatePayload) => void;

  // Actions - Biometric
  setBiometricSupported: (supported: boolean) => void;
  setBiometricAvailable: (available: boolean) => void;
  setBiometricCredentials: (hasCredentials: boolean) => void;
  setBiometricRegistering: (registering: boolean) => void;
  setBiometricError: (error: string | null) => void;
  setBiometricSuccess: (success: boolean) => void;
  resetBiometric: () => void;

  // Actions - Loading states
  setProfileLoading: (loading: boolean) => void;
  setUpdating: (updating: boolean) => void;

  // Actions - Error handling
  setUserError: (error: string | null) => void;
  clearUserError: () => void;
};

export type UserStore = UserState & UserActions;

// Create user store with middleware
type UserStoreCreator = StateCreator<
  UserStore,
  [['zustand/devtools', never], ['zustand/persist', unknown], ['zustand/immer', never]]
>;

const createBiometricState = (): UserState['biometric'] => ({
  isSupported: null,
  isAvailable: null,
  hasCredentials: null,
  isRegistering: false,
  error: null,
  success: false,
});

export const createInitialUserState = (): UserState => ({
  // Initial state
  user: null,
  session: null,
  isAuthenticated: false,
  profile: null,

  // Profile editing state
  profileEditData: null,
  isProfileEditing: false,
  profileEditErrors: {},

  // Address and representatives
  currentAddress: '',
  currentState: '',
  representatives: [],
  showAddressForm: false,
  newAddress: '',
  addressLoading: false,
  savedSuccessfully: false,

  // Avatar editing
  avatarFile: null,
  avatarPreview: null,
  isUploadingAvatar: false,

  biometric: createBiometricState(),
  isLoading: false,
  isProfileLoading: false,
  isUpdating: false,
  error: null,
});

export const initialUserState: UserState = createInitialUserState();

export const createUserActions = (
  set: Parameters<UserStoreCreator>[0],
  get: Parameters<UserStoreCreator>[1]
): UserActions => {
  const setUserState = set as unknown as (fn: (draft: UserState) => void) => void;
  const setState = (recipe: (draft: UserState) => void) => {
    setUserState(recipe);
  };

  const resetUserState = (state: UserState) => {
    Object.assign(state, createInitialUserState());
  };

  const baseActions = createBaseStoreActions<UserState>(setState);

  const actions: UserActions = {
    ...baseActions,

    setUser: (user: User | null) => setState((state) => {
      if (state.user !== user) {
        state.user = user;
      }
    }),

    setSession: (session: Session | null) => setState((state) => {
      if (state.session !== session) {
        state.session = session;
      }
    }),

    setAuthenticated: (authenticated: boolean) => {
      let shouldCascade = false;
      setState((state) => {
        if (state.isAuthenticated === authenticated) {
          return;
        }
        if (!authenticated) {
          resetUserState(state);
          shouldCascade = true;
          return;
        }
        state.isAuthenticated = true;
      });
      if (shouldCascade) {
        cascadeDependentStoreReset();
      }
    },

    setUserAndAuth: (user: User | null, authenticated: boolean) => {
      let shouldCascade = false;
      setState((state) => {
        if (!authenticated) {
          resetUserState(state);
          shouldCascade = true;
          return;
        }
        state.user = user;
        state.isAuthenticated = true;
      });
      if (shouldCascade) {
        cascadeDependentStoreReset();
      }
    },

    setSessionAndDerived: (session: Session | null) => {
      let shouldCascade = false;
      setState((state) => {
        if (state.session === session) {
          return;
        }

        state.session = session;

        const newUser = session?.user ?? null;
        const newAuthenticated = Boolean(newUser);

        if (state.user !== newUser) {
          state.user = newUser;
        }
        if (newAuthenticated) {
          state.isAuthenticated = true;
        } else {
          resetUserState(state);
          shouldCascade = true;
        }
      });
      if (shouldCascade) {
        cascadeDependentStoreReset();
      }
    },

    initializeAuth: (user: User | null, session: Session | null, authenticated: boolean) => {
      let shouldCascade = false;
      setState((state) => {
        if (!authenticated) {
          resetUserState(state);
          shouldCascade = true;
          return;
        }
        state.user = user;
        state.session = session;
        state.isAuthenticated = true;
      });
      if (shouldCascade) {
        cascadeDependentStoreReset();
      }
    },

    signOut: () => {
      setState((state) => {
        resetUserState(state);
      });
      cascadeDependentStoreReset();
    },

    clearUser: () => setState((state) => {
      resetUserState(state);
    }),

    setProfile: (profile: SupabaseUserProfileRow | UserProfile | null) => setState((state) => {
      state.profile = mapProfileRowToUserProfile(profile);
    }),

    updateProfile: (updates: UserProfileUpdatePayload) => {
      const current = get().profile;
      if (!current) {
        return;
      }
      const next: UserProfile = { ...current };
      assignDefined(next, updates);
      if (!updates.updated_at) {
        next.updated_at = new Date().toISOString();
      }
      setState((state) => {
        state.profile = next;
      });
    },

    setProfileLoading: (loading: boolean) => setState((state) => {
      state.isProfileLoading = loading;
    }),

    setUpdating: (updating: boolean) => setState((state) => {
      state.isUpdating = updating;
    }),

    setBiometricSupported: (supported: boolean) => setState((state) => {
      state.biometric.isSupported = supported;
    }),

    setBiometricAvailable: (available: boolean) => setState((state) => {
      state.biometric.isAvailable = available;
    }),

    setBiometricCredentials: (hasCredentials: boolean) => setState((state) => {
      state.biometric.hasCredentials = hasCredentials;
    }),

    setBiometricRegistering: (registering: boolean) => setState((state) => {
      state.biometric.isRegistering = registering;
    }),

    setBiometricError: (error: string | null) => setState((state) => {
      state.biometric.error = error;
    }),

    setBiometricSuccess: (success: boolean) => setState((state) => {
      state.biometric.success = success;
    }),

    resetBiometric: () => setState((state) => {
      state.biometric = {
        isSupported: null,
        isAvailable: null,
        hasCredentials: null,
        isRegistering: false,
        error: null,
        success: false
      };
    }),

    setProfileEditData: (data: ProfileEditDraft | null) => setState((state) => {
      state.profileEditData = data ?? null;
    }),

    updateProfileEditData: (updates: Partial<ProfileUpdateData>) =>
      setState((state) => {
        if (Object.keys(updates).length === 0) {
          return;
        }
        const target = state.profileEditData ?? (state.profileEditData = {} as ProfileEditDraft);
        assignDefined(target, updates);
      }),

    updateProfileField: <K extends keyof ProfileEditDraft>(
      field: K,
      value: ProfileEditDraft[K]
    ) =>
      setState((state) => {
        const target = state.profileEditData ?? (state.profileEditData = {} as ProfileEditDraft);
        target[field] = value;
      }),

    updateArrayField: (field: 'primary_concerns' | 'community_focus', value: string) =>
      setState((state) => {
        const target = state.profileEditData ?? (state.profileEditData = {} as ProfileEditDraft);
        const currentArray = Array.isArray(target[field])
          ? [...(target[field] as string[])]
          : [];
        const newArray = currentArray.includes(value)
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value];

        if (field === 'primary_concerns') {
          target.primary_concerns = newArray;
        } else {
          target.community_focus = newArray;
        }
      }),

    updatePrivacySetting: <K extends PrivacySettingKey>(
      setting: K,
      value: PrivacySettingValue<K>
    ) =>
      setState((state) => {
        const target = state.profileEditData ?? (state.profileEditData = {} as ProfileEditDraft);
        const settings =
          target.privacy_settings ?? (target.privacy_settings = {} as Partial<PrivacySettings>);
        settings[setting] = value;
      }),

    setProfileEditing: (editing: boolean) => setState((state) => {
      state.isProfileEditing = editing;
    }),

    setProfileEditError: (field: ProfileEditErrorKey, error: string) => setState((state) => {
      state.profileEditErrors[field] = error;
    }),

    clearProfileEditError: (field: ProfileEditErrorKey) => setState((state) => {
      delete state.profileEditErrors[field];
    }),

    clearAllProfileEditErrors: () => setState((state) => {
      state.profileEditErrors = {};
    }),

    setCurrentAddress: (address: string) => setState((state) => {
      state.currentAddress = address;
    }),

    setCurrentState: (stateValue: string) => setState((state) => {
      state.currentState = stateValue;
    }),

    setRepresentatives: (representatives: Representative[]) => setState((state) => {
      state.representatives = representatives;
    }),

    addRepresentative: (representative: Representative) => setState((state) => {
      const existingIndex = state.representatives.findIndex((rep) => String(rep.id) === String(representative.id));
      if (existingIndex === -1) {
        state.representatives.push(representative);
      }
    }),

    removeRepresentative: (id: string) => setState((state) => {
      state.representatives = state.representatives.filter((rep) => String(rep.id) !== String(id));
    }),

    setShowAddressForm: (show: boolean) => setState((state) => {
      state.showAddressForm = show;
    }),

    setNewAddress: (address: string) => setState((state) => {
      state.newAddress = address;
    }),

    setAddressLoading: (loading: boolean) => setState((state) => {
      state.addressLoading = loading;
    }),

    setSavedSuccessfully: (saved: boolean) => setState((state) => {
      state.savedSuccessfully = saved;
    }),

    lookupAddress: async (address: string) => {
      const response = await fetch('/api/v1/civics/address-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      if (!response.ok) {
        throw new Error('Address lookup failed');
      }

      const result = await response.json();
      if (result?.success !== true) {
        throw new Error(result?.error ?? 'Address lookup failed');
      }

      const jurisdiction = result?.data?.jurisdiction ?? result?.jurisdiction ?? {};
      const stateCode = typeof jurisdiction.state === 'string' ? jurisdiction.state : null;

      if (!stateCode) {
        return [];
      }

      const repsResponse = await fetch(
        `/api/v1/civics/by-state?state=${encodeURIComponent(stateCode)}&level=federal&limit=20`
      );

      if (!repsResponse.ok) {
        throw new Error('Failed to load representatives');
      }

      const repsResult = await repsResponse.json();
      return Array.isArray(repsResult?.data?.representatives) ? repsResult.data.representatives : [];
    },

    handleAddressUpdate: async (address: string, temporary = false) => {
      const currentState = get();
      setState((state) => {
        state.addressLoading = true;
      });

      try {
        const representatives = await currentState.lookupAddress(address);

        const canStoreLocation = Boolean(
          (currentState.profile?.privacy_settings as Partial<PrivacySettings> | undefined)?.collectLocationData
        );

        setState((state) => {
          state.representatives = representatives;

          if (canStoreLocation && !temporary) {
            state.currentAddress = address;
            logger.info('Location stored (user consented)', { address });
          } else {
            state.currentAddress = '';
            if (temporary) {
              logger.debug('Location used temporarily (not stored)', { address });
            } else {
              logger.debug('Location not stored (no consent)', { address });
            }
          }

          state.showAddressForm = false;
          state.newAddress = '';
          state.savedSuccessfully = true;
          state.addressLoading = false;
        });

        setTimeout(() => {
          setState((state) => {
            state.savedSuccessfully = false;
          });
        }, 3000);
      } catch (error) {
        setState((state) => {
          state.addressLoading = false;
          state.savedSuccessfully = false;
        });
        throw error;
      }
    },

    setAvatarFile: (file: File | null) => setState((state) => {
      state.avatarFile = file;
    }),

    setAvatarPreview: (preview: string | null) => setState((state) => {
      state.avatarPreview = preview;
    }),

    setUploadingAvatar: (uploading: boolean) => setState((state) => {
      state.isUploadingAvatar = uploading;
    }),

    clearAvatar: () => setState((state) => {
      state.avatarFile = null;
      state.avatarPreview = null;
    }),

    setUserError: (error: string | null) => setState((state) => {
      state.error = error;
    }),

    clearUserError: () => setState((state) => {
      state.error = null;
    })
  } satisfies UserActions;

  return actions;
};

export const userStoreCreator: UserStoreCreator = (set, get) =>
  Object.assign(createInitialUserState(), createUserActions(set, get));

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      immer(userStoreCreator),
      {
        name: 'user-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          profile: state.profile,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'user-store' }
  )
);


// Store selectors for optimized re-renders
export const useUser = () => useUserStore(state => state.user);
export const useSession = () => useUserStore(state => state.session);
export const useIsAuthenticated = () => useUserStore(state => state.isAuthenticated);
export const useUserProfile = () => useUserStore(state => state.profile);
export const useUserLoading = () => useUserStore(state => state.isLoading);
export const useUserError = () => useUserStore(state => state.error);

// Biometric selectors
export const useBiometric = () => useUserStore(state => state.biometric);
export const useBiometricSupported = () => useUserStore(state => state.biometric.isSupported);
export const useBiometricAvailable = () => useUserStore(state => state.biometric.isAvailable);
export const useBiometricCredentials = () => useUserStore(state => state.biometric.hasCredentials);
export const useBiometricRegistering = () => useUserStore(state => state.biometric.isRegistering);
export const useBiometricError = () => useUserStore(state => state.biometric.error);
export const useBiometricSuccess = () => useUserStore(state => state.biometric.success);

// Action selectors - FIXED: Use individual selectors to prevent infinite re-renders
export const useUserActions = () => {
  const setLoading = useUserStore(state => state.setLoading);
  const setError = useUserStore(state => state.setError);
  const clearError = useUserStore(state => state.clearError);
  const setUser = useUserStore(state => state.setUser);
  const setSession = useUserStore(state => state.setSession);
  const setAuthenticated = useUserStore(state => state.setAuthenticated);
  const signOut = useUserStore(state => state.signOut);
  const clearUser = useUserStore(state => state.clearUser);
  const setProfile = useUserStore(state => state.setProfile);
  const updateProfile = useUserStore(state => state.updateProfile);
  const setProfileLoading = useUserStore(state => state.setProfileLoading);
  const setUpdating = useUserStore(state => state.setUpdating);
  const setUserError = useUserStore(state => state.setUserError);
  const clearUserError = useUserStore(state => state.clearUserError);
  const setBiometricSupported = useUserStore(state => state.setBiometricSupported);
  const setBiometricAvailable = useUserStore(state => state.setBiometricAvailable);
  const setBiometricCredentials = useUserStore(state => state.setBiometricCredentials);
  const setBiometricRegistering = useUserStore(state => state.setBiometricRegistering);
  const setBiometricError = useUserStore(state => state.setBiometricError);
  const setBiometricSuccess = useUserStore(state => state.setBiometricSuccess);
  const resetBiometric = useUserStore(state => state.resetBiometric);
  // Profile editing actions
  const setProfileEditData = useUserStore(state => state.setProfileEditData);
  const updateProfileEditData = useUserStore(state => state.updateProfileEditData);
  const updateProfileField = useUserStore(state => state.updateProfileField);
  const updateArrayField = useUserStore(state => state.updateArrayField);
  const updatePrivacySetting = useUserStore(state => state.updatePrivacySetting);
  const setProfileEditing = useUserStore(state => state.setProfileEditing);
  const setProfileEditError = useUserStore(state => state.setProfileEditError);
  const clearProfileEditError = useUserStore(state => state.clearProfileEditError);
  const clearAllProfileEditErrors = useUserStore(state => state.clearAllProfileEditErrors);
  // Address and representatives actions
  const setCurrentAddress = useUserStore(state => state.setCurrentAddress);
  const setCurrentState = useUserStore(state => state.setCurrentState);
  const setRepresentatives = useUserStore(state => state.setRepresentatives);
  const addRepresentative = useUserStore(state => state.addRepresentative);
  const removeRepresentative = useUserStore(state => state.removeRepresentative);
  const setShowAddressForm = useUserStore(state => state.setShowAddressForm);
  const setNewAddress = useUserStore(state => state.setNewAddress);
  const setAddressLoading = useUserStore(state => state.setAddressLoading);
  const setSavedSuccessfully = useUserStore(state => state.setSavedSuccessfully);
  const lookupAddress = useUserStore(state => state.lookupAddress);
  const handleAddressUpdate = useUserStore(state => state.handleAddressUpdate);
  // Avatar actions
  const setAvatarFile = useUserStore(state => state.setAvatarFile);
  const setAvatarPreview = useUserStore(state => state.setAvatarPreview);
  const setUploadingAvatar = useUserStore(state => state.setUploadingAvatar);
  const clearAvatar = useUserStore(state => state.clearAvatar);

  return {
    setLoading,
    setError,
    clearError,
    setUser,
    setSession,
    setAuthenticated,
    signOut,
    clearUser,
    setProfile,
    updateProfile,
    setProfileLoading,
    setUpdating,
    setUserError,
    clearUserError,
    setBiometricSupported,
    setBiometricAvailable,
    setBiometricCredentials,
    setBiometricRegistering,
    setBiometricError,
    setBiometricSuccess,
    resetBiometric,
    setProfileEditData,
    updateProfileEditData,
    updateProfileField,
    updateArrayField,
    updatePrivacySetting,
    setProfileEditing,
    setProfileEditError,
    clearProfileEditError,
    clearAllProfileEditErrors,
    setCurrentAddress,
    setCurrentState,
    setRepresentatives,
    addRepresentative,
    removeRepresentative,
    setShowAddressForm,
    setNewAddress,
    setAddressLoading,
    setSavedSuccessfully,
    lookupAddress,
    handleAddressUpdate,
    setAvatarFile,
    setAvatarPreview,
    setUploadingAvatar,
    clearAvatar,
  };
};

// Computed selectors
export const useUserDisplayName = () => useUserStore(state => {
  if (state.profile?.username) return state.profile.username;
  if (state.user?.user_metadata?.full_name) return state.user.user_metadata.full_name;
  if (state.user?.email) return state.user.email.split('@')[0];
  return 'User';
});

export const useUserAvatar = () => useUserStore(state => {
  if (state.profile?.avatar_url) return state.profile.avatar_url;
  if (state.user?.user_metadata?.avatar_url) return state.user?.user_metadata.avatar_url;
  return null;
});

// Theme and notifications can be derived from privacy_settings or user metadata
export const useUserTheme = () => useUserStore(state => {
  return state.user?.user_metadata?.theme ?? 'system';
});

// Profile editing selectors
export const useUserProfileEditData = () => useUserStore(state => state.profileEditData);
export const useUserIsProfileEditing = () => useUserStore(state => state.isProfileEditing);
export const useUserProfileEditErrors = () => useUserStore(state => state.profileEditErrors);

// Address and representatives selectors
export const useUserCurrentAddress = () => useUserStore(state => state.currentAddress);
export const useUserCurrentState = () => useUserStore(state => state.currentState);
export const useUserRepresentatives = () => useUserStore(state => state.representatives);
export const useUserShowAddressForm = () => useUserStore(state => state.showAddressForm);
export const useUserNewAddress = () => useUserStore(state => state.newAddress);
export const useUserAddressLoading = () => useUserStore(state => state.addressLoading);
export const useUserSavedSuccessfully = () => useUserStore(state => state.savedSuccessfully);

// Avatar selectors
export const useUserAvatarFile = () => useUserStore(state => state.avatarFile);
export const useUserAvatarPreview = () => useUserStore(state => state.avatarPreview);
export const useUserIsUploadingAvatar = () => useUserStore(state => state.isUploadingAvatar);

// Store utilities
export const userStoreUtils = {

  /**
   * Get user's full profile with computed fields
   */
  getFullProfile: () => {
    const state = useUserStore.getState();
    if (!state.profile || !state.user) return null;

    return {
      ...state.profile,
      email: state.user.email,
      id: state.user.id,
      createdAt: state.user.created_at,
      lastSignIn: state.user.last_sign_in_at,
    };
  },

  /**
   * Check if user is admin
   */
  isAdmin: () => {
    const state = useUserStore.getState();
    return state.user?.user_metadata?.role === 'admin';
  },

  /**
   * Get user's display information
   */
  getDisplayInfo: () => {
    const state = useUserStore.getState();
    return {
      name: state.profile?.username ?? state.user?.email?.split('@')[0] ?? 'User',
      avatar: state.profile?.avatar_url ?? state.user?.user_metadata?.avatar_url,
      email: state.user?.email,
      theme: state.user?.user_metadata?.theme ?? 'system',
    };
  }
};

// Store subscriptions for external integrations
export const userStoreSubscriptions = {
  /**
   * Subscribe to authentication changes
   */
  onAuthChange: (callback: (isAuthenticated: boolean, user: User | null) => void) => {
    return useUserStore.subscribe(
      (state, prevState) => {
        const { isAuthenticated, user } = state;
        const { isAuthenticated: prevIsAuthenticated, user: prevUser } = prevState;
        if (isAuthenticated !== prevIsAuthenticated || user !== prevUser) {
          callback(isAuthenticated, user);
        }
      }
    );
  },

  /**
   * Subscribe to profile changes
   */
  onProfileChange: (callback: (profile: UserProfile | null) => void) => {
    return useUserStore.subscribe(
      (state, prevState) => {
        const { profile } = state;
        const { profile: prevProfile } = prevState;
        if (profile !== prevProfile) {
          callback(profile);
        }
      }
    );
  },

};

// Store debugging utilities
export const userStoreDebug = {
  /**
   * Log current user state
   */
  logState: () => {
    useUserStore.getState();
    // User store state logged for debugging
  },

  /**
   * Log user profile details
   */
  logProfile: () => {
    const state = useUserStore.getState();
    if (state.profile) {
      // Profile logging removed for production
    }
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    useUserStore.getState().clearUser();
  }
};
