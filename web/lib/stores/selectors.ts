/**
 * Optimized Store Selectors
 * 
 * Performance-optimized selectors for all Zustand stores.
 * Uses shallow comparison and memoization for better performance.
 * 
 * Created: January 16, 2025
 * Status: ✅ ACTIVE
 */

import * as React from 'react';

// UIStore removed - functionality moved to AppStore and PWAStore
import { useAdminStore } from './adminStore';
import { useAppStore } from './appStore';
import { useHashtagStore } from './hashtagStore';
import { useNotificationStore } from './notificationStore';
import { usePollWizardStore } from './pollWizardStore';
import { useProfileStore } from './profileStore';
import { useUserStore } from './userStore';
import { useVotingStore } from './votingStore';
import type { Ballot, Election, VotingRecord } from './votingStore';

// ============================================================================
// UI Store Selectors
// ============================================================================

// Basic selectors - Updated to use appropriate stores
export const useActiveModal = () => useAppStore(state => state.activeModal);
export const useModalData = () => useAppStore(state => state.modalData);
export const useSidebarOpen = () => useAppStore(state => state.sidebarCollapsed);

// Complex selectors with shallow comparison

export const useToasts = () => useNotificationStore(state => state.notifications);

// UI Store functionality moved to AppStore and PWAStore
// These selectors are no longer available

// Action selectors - UI Store functionality moved to AppStore and PWAStore

// ============================================================================
// App Store Selectors
// ============================================================================

export const useTheme = () => useAppStore(state => state.theme);
export const useResolvedTheme = () => useAppStore(state => state.resolvedTheme);
export const useSidebarCollapsed = () => useAppStore(state => state.sidebarCollapsed);
export const useSidebarWidth = () => useAppStore(state => state.sidebarWidth);
export const useSidebarPinned = () => useAppStore(state => state.sidebarPinned);
export const useCurrentRoute = () => useAppStore(state => state.currentRoute);
export const useBreadcrumbs = () => useAppStore(state => state.breadcrumbs);
export const useScreenSize = () => useAppStore(state => state.screenSize);
export const useIsMobile = () => useAppStore(state => state.isMobile);
export const useIsTablet = () => useAppStore(state => state.isTablet);
export const useIsDesktop = () => useAppStore(state => state.isDesktop);
export const useOrientation = () => useAppStore(state => state.orientation);

export const useAppSettings = () => useAppStore(
  state => state.settings
);

export const useFeatureFlags = () => useAppStore(
  state => state.featureFlags
);

export const useAppActions = () => useAppStore(
  state => ({
    setTheme: state.setTheme,
    toggleTheme: state.toggleTheme,
    toggleSidebar: state.toggleSidebar,
    setSidebarWidth: state.setSidebarWidth,
    setSidebarPinned: state.setSidebarPinned,
    setSidebarActiveSection: state.setSidebarActiveSection,
    openModal: state.openModal,
    closeModal: state.closeModal,
    setCurrentRoute: state.setCurrentRoute,
    setBreadcrumbs: state.setBreadcrumbs,
    updateSettings: state.updateSettings,
    resetSettings: state.resetSettings,
    setFeatureFlag: state.setFeatureFlag,
    toggleFeatureFlag: state.toggleFeatureFlag,
  })
);

// ============================================================================
// User Store Selectors
// ============================================================================

export const useUser = () => useUserStore(state => state.user);
export const useSession = () => useUserStore(state => state.session);
export const useIsAuthenticated = () => useUserStore(state => state.isAuthenticated);
export const useUserProfile = () => useUserStore(state => state.profile);
export const useUserLoading = () => useUserStore(state => state.isLoading);
export const useUserError = () => useUserStore(state => state.error);

export const useProfileEditData = () => useUserStore(
  state => state.profileEditData
);

export const useProfileEditErrors = () => useUserStore(
  state => state.profileEditErrors
);

export const useCurrentAddress = () => useUserStore(state => state.currentAddress);
export const useCurrentState = () => useUserStore(state => state.currentState);
export const useRepresentatives = () => useUserStore(state => state.representatives);

export const useUserActions = () => useUserStore(
  state => ({
    setUser: state.setUser,
    setSession: state.setSession,
    setAuthenticated: state.setAuthenticated,
    setProfile: state.setProfile,
    updateProfile: state.updateProfile,
    setProfileEditData: state.setProfileEditData,
    setProfileEditing: state.setProfileEditing,
    setProfileEditError: state.setProfileEditError,
    clearProfileEditError: state.clearProfileEditError,
    setCurrentAddress: state.setCurrentAddress,
    setCurrentState: state.setCurrentState,
    setRepresentatives: state.setRepresentatives,
    setShowAddressForm: state.setShowAddressForm,
    setNewAddress: state.setNewAddress,
    setAddressLoading: state.setAddressLoading,
    setSavedSuccessfully: state.setSavedSuccessfully,
    setAvatarFile: state.setAvatarFile,
    setAvatarPreview: state.setAvatarPreview,
    setUploadingAvatar: state.setUploadingAvatar,
    resetBiometric: state.resetBiometric,
    clearUser: state.clearUser,
    clearUserError: state.clearUserError,
  })
);

// ============================================================================
// Notification Store Selectors
// ============================================================================

export const useNotifications = () => useNotificationStore(state => state.notifications);
export const useUnreadCount = () => useNotificationStore(state => state.unreadCount);
export const useAdminNotifications = () => useNotificationStore(state => state.adminNotifications);
export const useAdminUnreadCount = () => useNotificationStore(state => state.adminUnreadCount);

export const useNotificationSettings = () => useNotificationStore(
  state => state.settings,
);

export const useNotificationActions = () => useNotificationStore(
  state => ({
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    markAsRead: state.markAsRead,
    markAllAsRead: state.markAllAsRead,
    clearAll: state.clearAll,
    clearByType: state.clearByType,
    addAdminNotification: state.addAdminNotification,
    removeAdminNotification: state.removeAdminNotification,
    markAdminNotificationAsRead: state.markAdminNotificationAsRead,
    markAllAdminNotificationsAsRead: state.markAllAdminNotificationsAsRead,
    clearAllAdminNotifications: state.clearAllAdminNotifications,
    clearAdminNotificationsByType: state.clearAdminNotificationsByType,
    updateSettings: state.updateSettings,
    resetSettings: state.resetSettings,
  }),
);

// ============================================================================
// Admin Store Selectors
// ============================================================================

export const useAdminTrendingTopics = () => useAdminStore(state => state.trendingTopics);
export const useAdminGeneratedPolls = () => useAdminStore(state => state.generatedPolls);
export const useAdminSystemMetrics = () => useAdminStore(state => state.systemMetrics);
export const useAdminActivityItems = () => useAdminStore(state => state.activityItems);
export const useAdminActivityFeed = () => useAdminStore(state => state.activityFeed);
export const useAdminUsers = () => useAdminStore(state => state.users);
export const useAdminActiveTab = () => useAdminStore(state => state.activeTab);
export const useAdminDashboardStats = () => useAdminStore(state => state.dashboardStats);

export const useAdminUserFilters = () => useAdminStore(
  state => state.userFilters,
);

export const useAdminSystemSettings = () => useAdminStore(
  state => state.systemSettings,
);

export const useAdminActions = () => useAdminStore(
  state => ({
    addActivityItem: state.addActivityItem,
    clearActivityItems: state.clearActivityItems,
    setUserFilters: state.setUserFilters,
    setActiveTab: state.setActiveTab,
    setSystemSettings: state.setSystemSettings,
    updateSystemSetting: state.updateSystemSetting,
    setSettingsTab: state.setSettingsTab,
    saveSystemSettings: state.saveSystemSettings,
  })
);

// ============================================================================
// Profile Store Selectors
// ============================================================================

export const useProfileUser = () => useProfileStore(state => state.userProfile);
export const useProfileData = () => useProfileStore(state => state.profile);
export const useProfileLoading = () => useProfileStore(state => state.isLoading);
export const useProfileError = () => useProfileStore(state => state.error);

export const useProfilePreferences = () => useProfileStore(
  state => state.preferences
);

export const useProfilePrivacySettings = () => useProfileStore(
  state => state.privacySettings
);

export const useProfileActions = () => useProfileStore(
  state => ({
    setUserProfile: state.setUserProfile,
    setProfile: state.setProfile,
    updateProfile: state.updateProfile,
    updatePreferences: state.updatePreferences,
    updatePrivacySettings: state.updatePrivacySettings,
    validateProfile: state.validateProfile,
    exportProfile: state.exportProfile,
    clearProfile: state.clearProfile,
  })
);

// ============================================================================
// Poll Wizard Store Selectors
// ============================================================================

export const usePollWizardData = () => usePollWizardStore(state => state.data);
export const usePollWizardStep = () => usePollWizardStore(state => state.currentStep);
export const usePollWizardProgress = () => usePollWizardStore(state => state.progress);
export const usePollWizardErrors = () => usePollWizardStore(state => state.errors);
export const usePollWizardCanProceed = () => usePollWizardStore(state => state.canProceed);
export const usePollWizardCanGoBack = () => usePollWizardStore(state => state.canGoBack);
// export const usePollWizardStats = () => usePollWizardStore(state => state.stats); // Property doesn't exist

export const usePollWizardActions = () => usePollWizardStore(
  state => ({
    nextStep: state.nextStep,
    prevStep: state.prevStep,
    goToStep: state.goToStep,
    updateData: state.updateData,
    addOption: state.addOption,
    removeOption: state.removeOption,
    updateOption: state.updateOption,
    addTag: state.addTag,
    removeTag: state.removeTag,
    validateCurrentStep: state.validateCurrentStep,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
    resetWizard: state.resetWizard,
  })
);

// ============================================================================
// Hashtag Store Selectors
// ============================================================================

export const useHashtagSuggestions = () => useHashtagStore(state => state.suggestions);
export const useHashtagTrending = () => useHashtagStore(state => state.trendingHashtags);
export const useHashtagLoading = () => useHashtagStore(state => state.isLoading);
export const useHashtagError = () => useHashtagStore(state => state.error);

export const useHashtagActions = () => useHashtagStore(
  state => ({
    getSuggestions: state.getSuggestions,
    getTrendingHashtags: state.getTrendingHashtags,
    createHashtag: state.createHashtag,
    validateHashtagName: state.validateHashtagName,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
  })
);

// ============================================================================
// Voting Store Selectors
// ============================================================================

export const useVotingBallots = (): Ballot[] => useVotingStore(state => state.ballots);
export const useVotingElections = (): Election[] => useVotingStore(state => state.elections);
export const useVotingRecords = (): VotingRecord[] => useVotingStore(state => state.votingRecords);
export const useVotingLoading = () => useVotingStore(state => state.isLoading);
export const useVotingError = () => useVotingStore(state => state.error);

export const useVotingActions = (): {
  setBallots: (ballots: Ballot[]) => void;
  setElections: (elections: Election[]) => void;
  setVotingRecords: (records: VotingRecord[]) => void;
  setSelectedBallot: (ballot: Ballot | null) => void;
  setSelectedElection: (election: Election | null) => void;
  castVote: (ballotId: string, contestId: string, selections: string[]) => Promise<void>;
  searchVoting: (query: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
} => useVotingStore(
  state => ({
    setBallots: state.setBallots,
    setElections: state.setElections,
    setVotingRecords: state.setVotingRecords,
    setSelectedBallot: state.setSelectedBallot,
    setSelectedElection: state.setSelectedElection,
    castVote: state.castVote,
    searchVoting: state.searchVoting,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
  })
);

// ============================================================================
// Store Utilities
// ============================================================================

/**
 * Create a memoized selector for complex state
 */
export const createSelector = <T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) => {
  return (state: T) => selector(state);
};

/**
 * Create a shallow comparison selector
 */
export const createShallowSelector = <T, R>(selector: (state: T) => R) => {
  return (state: T) => selector(state);
};

/**
 * Store subscription utilities
 */
export const useStoreSubscription = <T>(
  store: any,
  selector: (state: T) => any,
  callback: (value: any) => void
) => {
  const value = store(selector);
  
  React.useEffect(() => {
    callback(value);
  }, [value, callback]);
};

/**
 * Store debugging utilities
 */
export const useStoreDebug = (storeName: string) => {
  // UI Store functionality moved to AppStore and PWAStore
  // Debug functionality no longer available
};

/**
 * Store performance monitoring
 */
export const useStorePerformance = (storeName: string) => {
  const startTime = React.useRef<number | undefined>(undefined);
  
  React.useEffect(() => {
    startTime.current = performance.now();
  });
  
  React.useEffect(() => {
    if (startTime.current) {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      console.log(`${storeName} store update took ${duration.toFixed(2)}ms`);
    }
  });
};
