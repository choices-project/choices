/**
 * Simple Zustand Stores
 * 
 * Simplified versions of the stores without complex middleware
 * for initial implementation and testing.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { withOptional } from '@/lib/utils/objects';
import type { User, Session } from '@supabase/supabase-js';

// ============================================================================
// User Store (Simplified)
// ============================================================================

type UserProfile = {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
  settings: {
    privacy: 'public' | 'private' | 'friends';
    location: string;
    interests: string[];
  };
}

type UserStore = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  updatePreferences: (preferences: Partial<UserProfile['preferences']>) => void;
  updateSettings: (settings: Partial<UserProfile['settings']>) => void;
  signOut: () => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, _get) => ({
        user: null,
        session: null,
        isAuthenticated: false,
        profile: null,
        isLoading: false,
        error: null,
        
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        setSession: (session) => set({ session, user: session?.user || null, isAuthenticated: !!session?.user }),
        setProfile: (profile) => set({ profile }),
        
        updatePreferences: (preferences) => set((state) => ({
          profile: state.profile ? withOptional(state.profile, { preferences: withOptional(state.profile.preferences, preferences) }) : null
        })),
        
        updateSettings: (settings) => set((state) => ({
          profile: state.profile ? withOptional(state.profile, { settings: withOptional(state.profile.settings, settings) }) : null
        })),
        
        signOut: () => set({ user: null, session: null, profile: null, isAuthenticated: false, error: null }),
        clearUser: () => set({ user: null, session: null, profile: null, isAuthenticated: false, error: null, isLoading: false }),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
      }),
      {
        name: 'user-store',
        partialize: (state) => ({
          profile: state.profile,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'user-store' }
  )
);

// ============================================================================
// App Store (Simplified)
// ============================================================================

type AppStore = {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  features: Record<string, boolean>;
  settings: {
    animations: boolean;
    haptics: boolean;
    sound: boolean;
    autoSave: boolean;
    language: string;
    timezone: string;
  };
  currentRoute: string;
  breadcrumbs: Array<{ label: string; href: string; icon?: string }>;
  isLoading: boolean;
  error: string | null;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setFeatureFlag: (flag: string, enabled: boolean) => void;
  updateSettings: (settings: Partial<AppStore['settings']>) => void;
  setCurrentRoute: (route: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href: string; icon?: string }>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, _get) => ({
        theme: 'system',
        sidebarCollapsed: false,
        sidebarWidth: 280,
        features: {},
        settings: {
          animations: true,
          haptics: true,
          sound: true,
          autoSave: true,
          language: 'en',
          timezone: 'UTC',
        },
        currentRoute: '/',
        breadcrumbs: [],
        isLoading: false,
        error: null,
        
        setTheme: (theme) => set({ theme }),
        toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        setSidebarWidth: (width) => set({ sidebarWidth: Math.max(200, Math.min(400, width)) }),
        setFeatureFlag: (flag, enabled) => set((state) => ({ features: withOptional(state.features, { [flag]: enabled }) })),
        updateSettings: (settings) => set((state) => ({ settings: withOptional(state.settings, settings) })),
        setCurrentRoute: (route) => set({ currentRoute: route }),
        setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          sidebarWidth: state.sidebarWidth,
          features: state.features,
          settings: state.settings,
        }),
      }
    ),
    { name: 'app-store' }
  )
);

// ============================================================================
// Notification Store (Simplified)
// ============================================================================

type Notification = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: string;
  read: boolean;
}

type NotificationStore = {
  notifications: Notification[];
  unreadCount: number;
  settings: {
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration: number;
    maxNotifications: number;
  };
  isLoading: boolean;
  error: string | null;
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  updateSettings: (settings: Partial<NotificationStore['settings']>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, _get) => ({
      notifications: [],
      unreadCount: 0,
      settings: {
        position: 'top-right',
        duration: 5000,
        maxNotifications: 5,
      },
      isLoading: false,
      error: null,
      
      addNotification: (notification) => set((state) => {
        const newNotification: Notification = withOptional(notification, {
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          read: false,
        }) as Notification;
        
        const notifications = [newNotification, ...state.notifications].slice(0, state.settings.maxNotifications);
        const unreadCount = notifications.filter(n => !n.read).length;
        
        return { notifications, unreadCount };
      }),
      
      removeNotification: (id) => set((state) => {
        const notifications = state.notifications.filter(n => n.id !== id);
        const unreadCount = notifications.filter(n => !n.read).length;
        return { notifications, unreadCount };
      }),
      
      markAsRead: (id) => set((state) => {
        const notifications = state.notifications.map(n => n.id === id ? withOptional(n, { read: true }) : n);
        const unreadCount = notifications.filter(n => !n.read).length;
        return { notifications, unreadCount };
      }),
      
      markAllAsRead: () => set((state) => {
        const notifications = state.notifications.map(n => withOptional(n, { read: true }));
        return { notifications, unreadCount: 0 };
      }),
      
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
      updateSettings: (settings) => set((state) => ({ settings: withOptional(state.settings, settings) })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    { name: 'notification-store' }
  )
);

// ============================================================================
// Store Selectors
// ============================================================================

// User store selectors
export const useUser = () => useUserStore(state => state.user);
export const useIsAuthenticated = () => useUserStore(state => state.isAuthenticated);
export const useUserProfile = () => useUserStore(state => state.profile);
export const useUserLoading = () => useUserStore(state => state.isLoading);

// App store selectors
export const useTheme = () => useAppStore(state => state.theme);
export const useSidebarCollapsed = () => useAppStore(state => state.sidebarCollapsed);
export const useSidebarWidth = () => useAppStore(state => state.sidebarWidth);
export const useFeatureFlags = () => useAppStore(state => state.features);
export const useAppSettings = () => useAppStore(state => state.settings);

// Notification store selectors
export const useNotifications = () => useNotificationStore(state => state.notifications);
export const useUnreadCount = () => useNotificationStore(state => state.unreadCount);

// ============================================================================
// Store Actions
// ============================================================================

export const useUserActions = () => useUserStore(state => ({
  setUser: state.setUser,
  setSession: state.setSession,
  setProfile: state.setProfile,
  updatePreferences: state.updatePreferences,
  updateSettings: state.updateSettings,
  signOut: state.signOut,
  clearUser: state.clearUser,
}));

export const useAppActions = () => useAppStore(state => ({
  setTheme: state.setTheme,
  toggleTheme: state.toggleTheme,
  toggleSidebar: state.toggleSidebar,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setSidebarWidth: state.setSidebarWidth,
  setFeatureFlag: state.setFeatureFlag,
  updateSettings: state.updateSettings,
  setCurrentRoute: state.setCurrentRoute,
  setBreadcrumbs: state.setBreadcrumbs,
}));

export const useNotificationActions = () => useNotificationStore(state => ({
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  markAsRead: state.markAsRead,
  markAllAsRead: state.markAllAsRead,
  clearAll: state.clearAll,
}));

// ============================================================================
// Store Utilities
// ============================================================================

export const notificationUtils = {
  createSuccess: (title: string, message: string, duration?: number) => {
    useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  },
  
  createError: (title: string, message: string, duration?: number) => {
    useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      duration: duration || 0,
    });
  },
  
  createWarning: (title: string, message: string, duration?: number) => {
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  },
  
  createInfo: (title: string, message: string, duration?: number) => {
    useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  },
};
