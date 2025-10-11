/**
 * User Store - Zustand Implementation
 * 
 * Centralized user state management including authentication, profile,
 * preferences, and settings. Consolidates AuthContext and user-related state.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { withOptional } from '@/lib/utils/objects';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile, BaseStore } from './types';

// User store state interface
type UserStore = {
  // Authentication state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  
  // User profile data
  profile: UserProfile | null;
  
  // Loading states
  isProfileLoading: boolean;
  isUpdating: boolean;
  
  // Actions - Authentication
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  signOut: () => void;
  clearUser: () => void;
  
  // Actions - Profile
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (preferences: Partial<UserProfile['preferences']>) => void;
  updateSettings: (settings: Partial<UserProfile['settings']>) => void;
  updateMetadata: (metadata: Partial<UserProfile['metadata']>) => void;
  
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
          console.log('User authenticated:', user.email);
        } else {
          console.log('User signed out');
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
        
        console.log('User signed out - state cleared');
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
          console.log('User profile loaded:', profile.username);
        }
      }),
      
      updateProfile: (updates) => set((state) => {
        if (state.profile) {
          state.profile = withOptional(state.profile, updates);
          state.profile.metadata.updatedAt = new Date().toISOString();
        }
      }),
      
      updatePreferences: (preferences) => set((state) => {
        if (state.profile) {
          state.profile.preferences = withOptional(state.profile.preferences, preferences);
          state.profile.metadata.updatedAt = new Date().toISOString();
        }
      }),
      
      updateSettings: (settings) => set((state) => {
        if (state.profile) {
          state.profile.settings = withOptional(state.profile.settings, settings);
          state.profile.metadata.updatedAt = new Date().toISOString();
        }
      }),
      
      updateMetadata: (metadata) => set((state) => {
        if (state.profile) {
          state.profile.metadata = withOptional(state.profile.metadata, metadata);
        }
      }),
      
      // Loading state actions
      setProfileLoading: (loading) => set((state) => {
        state.isProfileLoading = loading;
      }),
      
      setUpdating: (updating) => set((state) => {
        state.isUpdating = updating;
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
        if (preferences !== prevPreferences) {
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
    console.log('User Store State:', {
      isAuthenticated: state.isAuthenticated,
      hasUser: !!state.user,
      hasProfile: !!state.profile,
      isLoading: state.isLoading,
      error: state.error
    });
  },
  
  /**
   * Log user profile details
   */
  logProfile: () => {
    const state = useUserStore.getState();
    if (state.profile) {
      console.log('User Profile:', {
        username: state.profile.username,
        email: state.user?.email,
        preferences: state.profile.preferences,
        settings: state.profile.settings,
        metadata: state.profile.metadata
      });
    }
  },
  
  /**
   * Reset store to initial state
   */
  reset: () => {
    useUserStore.getState().clearUser();
    console.log('User store reset to initial state');
  }
};
