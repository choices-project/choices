/**
 * Central Store Exports
 * 
 * Centralized exports for all Zustand stores, types, and utilities.
 * Provides a single import point for all store functionality.
 * 
 * Created: December 19, 2024
 * Status: ✅ ACTIVE
 */

// ============================================================================
// Store Imports (for internal use)
// ============================================================================

import { useUserStore } from './userStore';
import { useAppStore } from './appStore';
import { useNotificationStore } from './notificationStore';

// Import hooks from simpleStores
// Import hooks from individual store files
import { 
  useUser, 
  useIsAuthenticated, 
  useUserActions,
  userStoreDebug
} from './userStore';
import { 
  useTheme, 
  useSidebarCollapsed, 
  useAppActions,
  appStoreDebug
} from './appStore';
import { 
  useNotifications, 
  useUnreadCount, 
  useNotificationActions,
  notificationStoreDebug
} from './notificationStore';

// ============================================================================
// Store Exports
// ============================================================================

// Core stores
export { useUserStore } from './userStore';
export { useAppStore } from './appStore';
export { useNotificationStore } from './notificationStore';
export { useAdminStore } from './adminStore';
export { useOnboardingStore } from './onboardingStore';
export { useAnalyticsStore } from './analyticsStore';
export { useCivicsStore } from './civicsStore';
export { useFeedsStore } from './feedsStore';
export { usePollsStore } from './pollsStore';
export { usePWAStore } from './pwaStore';
export { useVotingStore } from './votingStore';

// Global System Stores
export { useFeatureFlagsStore } from './featureFlagsStore';
export { useGlobalUIStore } from './globalUIStore';
export { useDeviceStore } from './deviceStore';
export { usePerformanceStore } from './performanceStore';
export { useProfileStore } from './profileStore';
export { useHashtagStore } from './hashtagStore';

// ============================================================================
// Store Selectors
// ============================================================================

// User store selectors
export {
  useUser,
  useSession,
  useIsAuthenticated,
  useUserProfile,
  useUserPreferences,
  useUserSettings,
  useUserLoading,
  useUserError,
  useUserActions,
  useUserDisplayName,
  useUserAvatar,
  useUserTheme,
  useUserNotifications,
} from './userStore';

// App store selectors
export {
  useTheme,
  useSidebarCollapsed,
  useSidebarWidth,
  useSidebarPinned,
  useFeatureFlags,
  useAppSettings,
  useCurrentRoute,
  useBreadcrumbs,
  useAppLoading,
  useAppError,
  useAppActions,
  useIsFeatureEnabled,
  useAppTheme,
  useAppLanguage,
  useAppTimezone,
  useAppAnimations,
  useAppHaptics,
} from './appStore';

// Notification store selectors
export {
  useNotifications,
  useUnreadCount,
  useNotificationSettings,
  useNotificationLoading,
  useNotificationError,
  useNotificationActions,
  useNotificationsByType,
  useUnreadNotifications,
  useNotificationPosition,
  useNotificationDuration,
  useNotificationMaxCount,
} from './notificationStore';

// Admin store selectors
export {
  useTrendingTopics,
  useGeneratedPolls,
  useSystemMetrics,
  useActivityItems,
  useActivityFeed,
  useAdminNotifications,
  useAdminLoading,
  useAdminError,
  useAdminActions,
  useAdminStats,
  useRecentActivity,
} from './adminStore';

// Onboarding store selectors
export {
  useOnboardingStep,
  useOnboardingProgress,
  useOnboardingCompleted,
  useOnboardingSkipped,
  useOnboardingActive,
  useOnboardingData,
  useOnboardingLoading,
  useOnboardingError,
  useOnboardingActions,
  useOnboardingStats,
  useCurrentStepData,
  useStepValidation,
} from './onboardingStore';

// Analytics store selectors
export {
  useAnalyticsEvents,
  useAnalyticsMetrics,
  useAnalyticsBehavior,
  useAnalyticsDashboard,
  useAnalyticsPreferences,
  useAnalyticsTracking,
  useAnalyticsLoading,
  useAnalyticsError,
  useAnalyticsActions,
  useAnalyticsStats,
  useAnalyticsSession,
} from './analyticsStore';

// Civics store selectors
export {
  useRepresentatives,
  useDistricts,
  useCivicActions,
  useUserCivicProfile,
  useSelectedRepresentative,
  useSelectedDistrict,
  useCivicsPreferences,
  useCivicsLoading,
  useCivicsError,
  useCivicsActions,
  useCivicsStats,
  useFilteredRepresentatives,
} from './civicsStore';

// Feeds store selectors
export {
  useFeeds,
  useFilteredFeeds,
  useFeedCategories,
  useFeedSearch,
  useSelectedFeed,
  useFeedPreferences,
  useFeedFilters,
  useFeedsLoading,
  useFeedsError,
  useFeedsActions,
  useFeedsStats,
  useBookmarkedFeeds,
  useUnreadFeeds,
  useLikedFeeds,
} from './feedsStore';

// Polls store selectors
export {
  usePolls,
  useFilteredPolls,
  usePollComments,
  usePollSearch,
  useSelectedPoll,
  usePollPreferences,
  usePollFilters,
  usePollsLoading,
  usePollsError,
  usePollsActions,
  usePollsStats,
  useUserVotedPolls,
  useActivePolls,
  usePollComments as usePollCommentsByPoll,
} from './pollsStore';

// PWA store selectors
export {
  usePWAInstallation,
  usePWAOffline,
  usePWAUpdate,
  usePWANotifications,
  usePWAPerformance,
  usePWAPreferences,
  usePWALoading,
  usePWAError,
  usePWAActions,
  usePWAStats,
  useHighPriorityNotifications,
} from './pwaStore';

// Voting store selectors
export {
  useBallots,
  useElections,
  useVotingRecords,
  useVotingSearch,
  useSelectedBallot,
  useSelectedElection,
  useCurrentBallot,
  useVotingPreferences,
  useVotingLoading,
  useVotingError,
  useVotingActions,
  useVotingStats,
  useUpcomingElections,
  useActiveElections,
  useUserVotingHistory,
} from './votingStore';

// Profile store selectors
export {
  useProfile,
  useProfileLoading,
  useProfileError,
  useProfileDisplay,
  useProfileValidation,
  useProfileActions,
  useProfileStats,
  profileSelectors,
} from './profileStore';

// Hashtag store selectors
export {
  useHashtags,
  useHashtagSearch,
  useHashtagLoading,
  useHashtagError,
  useHashtagActions,
  useHashtagStats,
  hashtagSelectors,
} from './hashtagStore';

// ============================================================================
// Store Utilities
// ============================================================================

// User store utilities
export {
  userStoreUtils,
  userStoreSubscriptions,
  userStoreDebug,
} from './userStore';

// App store utilities
export {
  appStoreUtils,
  appStoreSubscriptions,
  appStoreDebug,
} from './appStore';

// Notification store utilities
export {
  notificationStoreUtils,
  notificationStoreSubscriptions,
  notificationStoreDebug,
} from './notificationStore';

// Admin store utilities
export {
  adminStoreUtils,
  adminStoreSubscriptions,
  adminStoreDebug,
} from './adminStore';

// Onboarding store utilities
export {
  onboardingStoreUtils,
  onboardingStoreSubscriptions,
  onboardingStoreDebug,
} from './onboardingStore';

// Analytics store utilities
export {
  analyticsStoreUtils,
  analyticsStoreSubscriptions,
  analyticsStoreDebug,
} from './analyticsStore';

// Civics store utilities
export {
  civicsStoreUtils,
  civicsStoreSubscriptions,
  civicsStoreDebug,
} from './civicsStore';

// Feeds store utilities
export {
  feedsStoreUtils,
  feedsStoreSubscriptions,
  feedsStoreDebug,
} from './feedsStore';

// Polls store utilities
export {
  pollsStoreUtils,
  pollsStoreSubscriptions,
  pollsStoreDebug,
} from './pollsStore';

// PWA store utilities
export {
  pwaStoreUtils,
  pwaStoreSubscriptions,
  pwaStoreDebug,
} from './pwaStore';

// Voting store utilities
export {
  votingStoreUtils,
  votingStoreSubscriptions,
  votingStoreDebug,
} from './votingStore';

// Profile store utilities
export {
  profileStoreUtils,
  profileStoreSubscriptions,
  profileStoreDebug,
} from './profileStore';

// Hashtag store utilities
export {
  hashtagStoreUtils,
  hashtagStoreSubscriptions,
  hashtagStoreDebug,
} from './hashtagStore';

// ============================================================================
// Type Exports
// ============================================================================

// Base types
export type {
  BaseStore,
  StoreMiddleware,
  StoreConfig,
  UserProfile,
  AppSettings,
  Notification,
  Breadcrumb,
  PWAState,
  FeatureFlag,
  AnalyticsEvent,
  StoreSelector,
  StoreAction,
  StoreSubscription,
  PersistOptions,
  DevtoolsOptions,
  LoggingOptions,
  StoreError,
  StorePerformance,
  StoreValidator,
  MiddlewareChain,
  BatchUpdate,
  StoreCache,
  StoreSync,
  StoreDebug,
  StoreTest,
  StoreDocumentation,
} from './types';

// Store interfaces - removed as they are not exported from their respective files

// ============================================================================
// Middleware Exports
// ============================================================================

export {
  loggingMiddleware,
  performanceMiddleware,
  errorHandlingMiddleware,
  persistenceMiddleware,
  analyticsMiddleware,
  validationMiddleware,
  batchUpdateMiddleware,
  createMiddlewareChain,
  createStoreMiddleware,
  storeDebug,
} from './middleware';

// ============================================================================
// Store Hooks (Combined)
// ============================================================================

/**
 * Combined store hooks for common patterns
 */
export const useStoreHooks = () => {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const theme = useTheme();
  const sidebarCollapsed = useSidebarCollapsed();
  const notifications = useNotifications();
  const unreadCount = useUnreadCount();
  
  return {
    user,
    isAuthenticated,
    theme,
    sidebarCollapsed,
    notifications,
    unreadCount,
  };
};

/**
 * Combined store actions for common patterns
 */
export const useStoreActions = () => {
  const userActions = useUserActions();
  const appActions = useAppActions();
  const notificationActions = useNotificationActions();
  
  return {
    user: userActions,
    app: appActions,
    notifications: notificationActions,
  };
};

/**
 * Combined store utilities for common patterns
 */
export const useStoreUtils = () => {
  return {
    user: useUserStore.getState(),
    app: useAppStore.getState(),
    notifications: useNotificationStore.getState(),
  };
};

// ============================================================================
// Store Initialization
// ============================================================================

/**
 * Initialize all stores with default values
 * Call this once at app startup
 */
export const initializeStores = () => {
  // Initialize app store
  useAppStore.getState().setLoading(false);
  
  // Initialize notification store
  useNotificationStore.getState().clearAll();
  
  console.log('All stores initialized');
};

/**
 * Reset all stores to initial state
 * Useful for testing or logout
 */
export const resetStores = () => {
  useUserStore.getState().clearUser();
  useAppStore.getState().resetSettings();
  useNotificationStore.getState().clearAll();
  
  console.log('All stores reset');
};

/**
 * Get store statistics
 */
export const getStoreStats = () => {
  const userState = useUserStore.getState();
  const appState = useAppStore.getState();
  const notificationState = useNotificationStore.getState();
  
  return {
    user: {
      isAuthenticated: userState.isAuthenticated,
      hasProfile: !!userState.profile,
      isLoading: userState.isLoading,
    },
    app: {
      theme: appState.theme,
      sidebarCollapsed: appState.sidebarCollapsed,
      featureFlags: Object.keys(appState.features).length,
      isLoading: appState.isLoading,
    },
    notifications: {
      total: notificationState.notifications.length,
      unread: notificationState.unreadCount,
      isLoading: notificationState.isLoading,
    },
  };
};

// ============================================================================
// Store Subscriptions (Combined)
// ============================================================================

/**
 * Subscribe to all store changes
 */
export const subscribeToAllStores = (callback: (stats: ReturnType<typeof getStoreStats>) => void) => {
  const unsubscribeUser = useUserStore.subscribe(
    (_state) => {
      callback(getStoreStats());
    }
  );
  
  const unsubscribeApp = useAppStore.subscribe(
    (_state) => {
      callback(getStoreStats());
    }
  );
  
  const unsubscribeNotifications = useNotificationStore.subscribe(
    (_state) => {
      callback(getStoreStats());
    }
  );
  
  return () => {
    unsubscribeUser();
    unsubscribeApp();
    unsubscribeNotifications();
  };
};

/**
 * Subscribe to authentication changes across all stores
 */
export const subscribeToAuthChanges = (callback: (isAuthenticated: boolean) => void) => {
  let prevIsAuthenticated: boolean | undefined;
  return useUserStore.subscribe(
    (state) => {
      const isAuthenticated = state.isAuthenticated;
      if (prevIsAuthenticated !== undefined && isAuthenticated !== prevIsAuthenticated) {
        callback(isAuthenticated);
      }
      prevIsAuthenticated = isAuthenticated;
    }
  );
};

/**
 * Subscribe to theme changes across all stores
 */
export const subscribeToThemeChanges = (callback: (theme: string) => void) => {
  let prevTheme: string | undefined;
  return useAppStore.subscribe(
    (state) => {
      const theme = state.theme;
      if (prevTheme !== undefined && theme !== prevTheme) {
        callback(theme);
      }
      prevTheme = theme;
    }
  );
};

// ============================================================================
// Store Debugging (Combined)
// ============================================================================

/**
 * Debug all stores
 */
export const debugAllStores = () => {
  userStoreDebug.logState();
  appStoreDebug.logState();
  notificationStoreDebug.logState();
  
  console.log('Store Statistics:', getStoreStats());
};

/**
 * Reset all stores for debugging
 */
export const debugResetAllStores = () => {
  useUserStore.getState().clearUser();
  useAppStore.getState().setError(null);
  useNotificationStore.getState().clearAll();
  
  console.log('All stores reset for debugging');
};

// ============================================================================
// Store Validation
// ============================================================================

/**
 * Validate all store states
 */
export const validateStores = () => {
  const errors: string[] = [];
  
  // Validate user store
  const userState = useUserStore.getState();
  if (userState.isAuthenticated && !userState.user) {
    errors.push('User store: authenticated but no user');
  }
  
  // Validate app store
  const appState = useAppStore.getState();
  if (appState.sidebarWidth < 200 || appState.sidebarWidth > 400) {
    errors.push('App store: sidebar width out of range');
  }
  
  // Validate notification store
  const notificationState = useNotificationStore.getState();
  if (notificationState.unreadCount < 0) {
    errors.push('Notification store: negative unread count');
  }
  
  if (errors.length > 0) {
    console.error('Store validation errors:', errors);
    return false;
  }
  
  console.log('All stores validated successfully');
  return true;
};

// ============================================================================
// Store Performance Monitoring
// ============================================================================

/**
 * Monitor store performance with optimized state access
 */
export const monitorStorePerformance = () => {
  const startTime = performance.now();
  
  // Get store states efficiently (only what we need)
  const userKeys = Object.keys(useUserStore.getState());
  const appKeys = Object.keys(useAppStore.getState());
  const notificationKeys = Object.keys(useNotificationStore.getState());
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (duration > 10) {
    console.warn('Slow store access detected:', `${duration.toFixed(2)}ms`);
  }
  
  return {
    duration,
    stores: {
      user: userKeys.length,
      app: appKeys.length,
      notifications: notificationKeys.length,
    }
  };
};
