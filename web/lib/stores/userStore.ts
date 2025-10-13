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
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { withOptional } from '@/lib/utils/objects';

import type { UserProfile, BaseStore } from './types';

// Profile editing types
export interface ProfileUpdateData {
  displayname: string;
  bio: string;
  username: string;
  primaryconcerns: string[];
  communityfocus: string[];
  participationstyle: 'observer' | 'participant' | 'leader' | 'organizer';
  privacysettings: {
    profile_visibility: 'public' | 'private' | 'friends';
    show_email: boolean;
    show_activity: boolean;
    allow_messages: boolean;
    share_demographics: boolean;
    allow_analytics: boolean;
  };
}

export interface Representative {
  id: string;
  name: string;
  title: string;
  party: string;
  district: string;
  state: string;
  phone?: string;
  email?: string;
  website?: string;
  photo?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

// User store state interface
type UserStore = {
  // Authentication state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  
  // User profile data
  profile: UserProfile | null;
  
  // Profile editing state
  profileEditData: ProfileUpdateData | null;
  isProfileEditing: boolean;
  profileEditErrors: Record<string, string>;
  
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
  
  // Actions - Authentication
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  signOut: () => void;
  clearUser: () => void;
  
  // Actions - Profile Editing
  setProfileEditData: (data: ProfileUpdateData) => void;
  updateProfileEditData: (updates: Partial<ProfileUpdateData>) => void;
  updateProfileField: (field: keyof ProfileUpdateData, value: any) => void;
  updateArrayField: (field: 'primaryconcerns' | 'communityfocus', value: string) => void;
  updatePrivacySetting: (setting: keyof ProfileUpdateData['privacysettings'], value: any) => void;
  setProfileEditing: (editing: boolean) => void;
  setProfileEditError: (field: string, error: string) => void;
  clearProfileEditError: (field: string) => void;
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
  handleAddressUpdate: (address: string) => Promise<void>;
  
  // Actions - Avatar
  setAvatarFile: (file: File | null) => void;
  setAvatarPreview: (preview: string | null) => void;
  setUploadingAvatar: (uploading: boolean) => void;
  clearAvatar: () => void;
  
  // Actions - Profile
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (preferences: Partial<UserProfile['preferences']>) => void;
  updateSettings: (settings: Partial<UserProfile['settings']>) => void;
  updateMetadata: (metadata: Partial<UserProfile['metadata']>) => void;
  
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
} & BaseStore

// Create user store with middleware
export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      immer((set, _get) => ({
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
      
      biometric: {
        isSupported: null,
        isAvailable: null,
        hasCredentials: null,
        isRegistering: false,
        error: null,
        success: false,
      },
      isLoading: false,
      isProfileLoading: false,
      isUpdating: false,
      error: null,
      
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
      
      // Authentication actions
      setUser: (user) => set((state) => {
        state.user = user;
        state.isAuthenticated = !!user;
        
        // Log authentication state change
        if (user) {
        } else {
        }
      }),
      
      setSession: (session) => set((state) => {
        state.session = session;
        
        // Update authentication state based on session
        if (session?.user) {
          state.user = session.user;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      }),
      
      setAuthenticated: (authenticated) => set((state) => {
        state.isAuthenticated = authenticated;
        
        if (!authenticated) {
          state.user = null;
          state.session = null;
          state.profile = null;
        }
      }),
      
      signOut: () => set((state) => {
        state.user = null;
        state.session = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.error = null;
        
      }),
      
      clearUser: () => set((state) => {
        state.user = null;
        state.session = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoading = false;
        state.isProfileLoading = false;
        state.isUpdating = false;
      }),
      
      // Profile actions
      setProfile: (profile) => set((state) => {
        state.profile = profile;
        
        if (profile) {
        }
      }),
      
      updateProfile: (updates) => set((state) => {
        if (state.profile) {
          state.profile = { ...state.profile, ...updates };
          state.profile.metadata.updatedAt = new Date().toISOString();
        }
      }),
      
      updatePreferences: (preferences) => set((state) => {
        if (state.profile) {
          state.profile.preferences = { ...state.profile.preferences, ...preferences };
          state.profile.metadata.updatedAt = new Date().toISOString();
        }
      }),
      
      updateSettings: (settings) => set((state) => {
        if (state.profile) {
          state.profile.settings = { ...state.profile.settings, ...settings };
          state.profile.metadata.updatedAt = new Date().toISOString();
        }
      }),
      
      updateMetadata: (metadata) => set((state) => {
        if (state.profile) {
          state.profile.metadata = { ...state.profile.metadata, ...metadata };
        }
      }),
      
      // Loading state actions
      setProfileLoading: (loading) => set((state) => {
        state.isProfileLoading = loading;
      }),
      
      setUpdating: (updating) => set((state) => {
        state.isUpdating = updating;
      }),
      
      // Biometric actions
      setBiometricSupported: (supported) => set((state) => {
        state.biometric.isSupported = supported;
      }),
      
      setBiometricAvailable: (available) => set((state) => {
        state.biometric.isAvailable = available;
      }),
      
      setBiometricCredentials: (hasCredentials) => set((state) => {
        state.biometric.hasCredentials = hasCredentials;
      }),
      
      setBiometricRegistering: (registering) => set((state) => {
        state.biometric.isRegistering = registering;
      }),
      
      setBiometricError: (error) => set((state) => {
        state.biometric.error = error;
      }),
      
      setBiometricSuccess: (success) => set((state) => {
        state.biometric.success = success;
      }),
      
      resetBiometric: () => set((state) => {
        state.biometric = {
          isSupported: null,
          isAvailable: null,
          hasCredentials: null,
          isRegistering: false,
          error: null,
          success: false,
        };
      }),
      
      // Profile editing actions
      setProfileEditData: (data) => set((state) => {
        state.profileEditData = data;
      }),
      
      updateProfileEditData: (updates) => set((state) => {
        if (state.profileEditData) {
          state.profileEditData = { ...state.profileEditData, ...updates };
        }
      }),
      
      updateProfileField: (field, value) => set((state) => {
        if (state.profileEditData) {
          state.profileEditData[field] = value;
        }
      }),
      
      updateArrayField: (field, value) => set((state) => {
        if (state.profileEditData) {
          const currentArray = state.profileEditData[field] || [];
          const newArray = currentArray.includes(value)
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value];
          state.profileEditData[field] = newArray;
        }
      }),
      
      updatePrivacySetting: (setting, value) => set((state) => {
        if (state.profileEditData) {
          (state.profileEditData.privacysettings as any)[setting] = value;
        }
      }),
      
      setProfileEditing: (editing) => set((state) => {
        state.isProfileEditing = editing;
      }),
      
      setProfileEditError: (field, error) => set((state) => {
        state.profileEditErrors[field] = error;
      }),
      
      clearProfileEditError: (field) => set((state) => {
        delete state.profileEditErrors[field];
      }),
      
      clearAllProfileEditErrors: () => set((state) => {
        state.profileEditErrors = {};
      }),
      
      // Address and representatives actions
      setCurrentAddress: (address) => set((state) => {
        state.currentAddress = address;
      }),
      
      setCurrentState: (stateValue) => set((state) => {
        state.currentState = stateValue;
      }),
      
      setRepresentatives: (representatives) => set((state) => {
        state.representatives = representatives;
      }),
      
      addRepresentative: (representative) => set((state) => {
        const existingIndex = state.representatives.findIndex(rep => rep.id === representative.id);
        if (existingIndex === -1) {
          state.representatives.push(representative);
        }
      }),
      
      removeRepresentative: (id) => set((state) => {
        state.representatives = state.representatives.filter(rep => rep.id !== id);
      }),
      
      setShowAddressForm: (show) => set((state) => {
        state.showAddressForm = show;
      }),
      
      setNewAddress: (address) => set((state) => {
        state.newAddress = address;
      }),
      
      setAddressLoading: (loading) => set((state) => {
        state.addressLoading = loading;
      }),
      
      setSavedSuccessfully: (saved) => set((state) => {
        state.savedSuccessfully = saved;
      }),
      
      lookupAddress: async (address) => {
        try {
          const response = await fetch(`/api/civics/by-address?address=${encodeURIComponent(address)}`);
          if (!response.ok) {
            throw new Error('Address lookup failed');
          }
          const result = await response.json();
          return result.data || [];
        } catch (error) {
          console.error('Address lookup failed:', error);
          throw error;
        }
      },
      
      handleAddressUpdate: async (address) => {
        const currentState = _get();
        set((state) => {
          state.addressLoading = true;
        });
        
        try {
          const representatives = await currentState.lookupAddress(address);
          
          set((state) => {
            state.currentAddress = address;
            state.representatives = representatives;
            state.showAddressForm = false;
            state.newAddress = '';
            state.savedSuccessfully = true;
            state.addressLoading = false;
          });
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            set((state) => {
              state.savedSuccessfully = false;
            });
          }, 3000);
          
        } catch (error) {
          console.error('Address update failed:', error);
          set((state) => {
            state.addressLoading = false;
            state.savedSuccessfully = false;
          });
          throw error;
        }
      },
      
      // Avatar actions
      setAvatarFile: (file) => set((state) => {
        state.avatarFile = file;
      }),
      
      setAvatarPreview: (preview) => set((state) => {
        state.avatarPreview = preview;
      }),
      
      setUploadingAvatar: (uploading) => set((state) => {
        state.isUploadingAvatar = uploading;
      }),
      
      clearAvatar: () => set((state) => {
        state.avatarFile = null;
        state.avatarPreview = null;
      }),
      
      // Error handling actions
      setUserError: (error) => set((state) => {
        state.error = error;
        
        if (error) {
          console.error('User store error:', error);
        }
      }),
      
      clearUserError: () => set((state) => {
        state.error = null;
      }),
    })),
    {
      name: 'user-store',
      partialize: (state) => ({
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  ),
  { name: 'user-store' }
));

// Store selectors for optimized re-renders
export const useUser = () => useUserStore(state => state.user);
export const useSession = () => useUserStore(state => state.session);
export const useIsAuthenticated = () => useUserStore(state => state.isAuthenticated);
export const useUserProfile = () => useUserStore(state => state.profile);
export const useUserPreferences = () => useUserStore(state => state.profile?.preferences);
export const useUserSettings = () => useUserStore(state => state.profile?.settings);
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

// Action selectors
export const useUserActions = () => useUserStore(state => ({
  setUser: state.setUser,
  setSession: state.setSession,
  setAuthenticated: state.setAuthenticated,
  signOut: state.signOut,
  clearUser: state.clearUser,
  setProfile: state.setProfile,
  updateProfile: state.updateProfile,
  updatePreferences: state.updatePreferences,
  updateSettings: state.updateSettings,
  updateMetadata: state.updateMetadata,
  setProfileLoading: state.setProfileLoading,
  setUpdating: state.setUpdating,
  setUserError: state.setUserError,
  clearUserError: state.clearUserError,
  setBiometricSupported: state.setBiometricSupported,
  setBiometricAvailable: state.setBiometricAvailable,
  setBiometricCredentials: state.setBiometricCredentials,
  setBiometricRegistering: state.setBiometricRegistering,
  setBiometricError: state.setBiometricError,
  setBiometricSuccess: state.setBiometricSuccess,
  resetBiometric: state.resetBiometric,
  // Profile editing actions
  setProfileEditData: state.setProfileEditData,
  updateProfileEditData: state.updateProfileEditData,
  updateProfileField: state.updateProfileField,
  updateArrayField: state.updateArrayField,
  updatePrivacySetting: state.updatePrivacySetting,
  setProfileEditing: state.setProfileEditing,
  setProfileEditError: state.setProfileEditError,
  clearProfileEditError: state.clearProfileEditError,
  clearAllProfileEditErrors: state.clearAllProfileEditErrors,
  // Address and representatives actions
  setCurrentAddress: state.setCurrentAddress,
  setCurrentState: state.setCurrentState,
  setRepresentatives: state.setRepresentatives,
  addRepresentative: state.addRepresentative,
  removeRepresentative: state.removeRepresentative,
  setShowAddressForm: state.setShowAddressForm,
  setNewAddress: state.setNewAddress,
  setAddressLoading: state.setAddressLoading,
  setSavedSuccessfully: state.setSavedSuccessfully,
  lookupAddress: state.lookupAddress,
  handleAddressUpdate: state.handleAddressUpdate,
  // Avatar actions
  setAvatarFile: state.setAvatarFile,
  setAvatarPreview: state.setAvatarPreview,
  setUploadingAvatar: state.setUploadingAvatar,
  clearAvatar: state.clearAvatar,
}));

// Computed selectors
export const useUserDisplayName = () => useUserStore(state => {
  if (state.profile?.username) return state.profile.username;
  if (state.user?.user_metadata?.full_name) return state.user.user_metadata.full_name;
  if (state.user?.email) return state.user.email.split('@')[0];
  return 'User';
});

export const useUserAvatar = () => useUserStore(state => {
  if (state.profile?.avatar) return state.profile.avatar;
  if (state.user?.user_metadata?.avatar_url) return state.user.user_metadata.avatar_url;
  return null;
});

export const useUserTheme = () => useUserStore(state => {
  return state.profile?.preferences?.theme || 'system';
});

export const useUserNotifications = () => useUserStore(state => {
  return state.profile?.preferences?.notifications ?? true;
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
   * Check if user has specific preference
   */
  hasPreference: (preference: keyof UserProfile['preferences']) => {
    const state = useUserStore.getState();
    return state.profile?.preferences?.[preference] ?? false;
  },
  
  /**
   * Check if user has specific setting
   */
  hasSetting: (setting: keyof UserProfile['settings']) => {
    const state = useUserStore.getState();
    return state.profile?.settings?.[setting] ?? false;
  },
  
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
      name: state.profile?.username || state.user?.email?.split('@')[0] || 'User',
      avatar: state.profile?.avatar || state.user?.user_metadata?.avatar_url,
      email: state.user?.email,
      theme: state.profile?.preferences?.theme || 'system',
      notifications: state.profile?.preferences?.notifications ?? true,
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
  
  /**
   * Subscribe to preference changes
   */
  onPreferenceChange: (callback: (preferences: UserProfile['preferences']) => void) => {
    return useUserStore.subscribe(
      (state, prevState) => {
        const preferences = state.profile?.preferences;
        const prevPreferences = prevState.profile?.preferences;
        if (preferences !== prevPreferences && preferences) {
          callback(preferences);
        }
      }
    );
  }
};

// Store debugging utilities
export const userStoreDebug = {
  /**
   * Log current user state
   */
  logState: () => {
    const state = useUserStore.getState();
    // State logging removed for production
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
