/**
 * Stores Index - Central Export
 * 
 * Centralized exports for all Zustand stores and their selectors
 */

// Feeds Store
export {
  useFeedsStore,
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
  feedsStoreUtils,
  feedsStoreSubscriptions,
  feedsStoreDebug
} from './feedsStore';

// User Store
export {
  useUserStore,
  useUser,
  useUserProfile,
  useUserPreferences,
  useUserStats,
  useUserActions,
  userStoreUtils,
  userStoreDebug
} from './userStore';

// Admin Store
export {
  useAdminStore,
  useAdmin,
  useAdminUsers,
  useAdminPolls,
  useAdminSystem,
  useAdminActions,
  adminStoreUtils,
  adminStoreDebug
} from './adminStore';

// Voting Store
export {
  useVotingStore,
  useVoting,
  useVotingHistory,
  useVotingStats,
  useVotingActions,
  votingStoreUtils,
  votingStoreDebug
} from './votingStore';

// Notification Store
export {
  useNotificationStore,
  useNotifications,
  useNotificationSettings,
  useNotificationActions,
  notificationStoreUtils,
  notificationStoreDebug
} from './notificationStore';

// Onboarding Store
export {
  useOnboardingStore,
  useOnboarding,
  useOnboardingStep,
  useOnboardingProgress,
  useOnboardingActions,
  onboardingStoreUtils,
  onboardingStoreDebug
} from './onboardingStore';

// PWA Store
export {
  usePWAStore,
  usePWA,
  usePWAInstallation,
  usePWAOffline,
  usePWANotifications,
  usePWAActions,
  pwaStoreUtils,
  pwaStoreDebug
} from './pwaStore';

// Performance Store
export {
  usePerformanceStore,
  usePerformance,
  usePerformanceMetrics,
  usePerformanceActions,
  performanceStoreUtils,
  performanceStoreDebug
} from './performanceStore';

// Analytics Store
export {
  useAnalyticsStore,
  useAnalytics,
  useAnalyticsData,
  useAnalyticsActions,
  analyticsStoreUtils,
  analyticsStoreDebug
} from './analyticsStore';

// Civics Store
export {
  useCivicsStore,
  useCivics,
  useCivicsData,
  useCivicsActions,
  civicsStoreUtils,
  civicsStoreDebug
} from './civicsStore';

// Device Store
export {
  useDeviceStore,
  useDevice,
  useDeviceInfo,
  useDeviceActions,
  deviceStoreUtils,
  deviceStoreDebug
} from './deviceStore';

// Polls Store
export {
  usePollsStore,
  usePolls,
  usePoll,
  usePollResults,
  usePollActions,
  pollsStoreUtils,
  pollsStoreDebug
} from './pollsStore';

// Profile Store
export {
  useProfileStore,
  useProfile,
  useProfileData,
  useProfileActions,
  profileStoreUtils,
  profileStoreDebug
} from './profileStore';

// Hashtag Store
export {
  useHashtagStore,
  useHashtags,
  useHashtagActions,
  hashtagStoreUtils,
  hashtagStoreDebug
} from './hashtagStore';

// Hashtag Moderation Store
export {
  useHashtagModerationStore,
  useHashtagModeration,
  useHashtagModerationActions,
  hashtagModerationStoreUtils,
  hashtagModerationStoreDebug
} from './hashtagModerationStore';

// Poll Wizard Store
export {
  usePollWizardStore,
  usePollWizard,
  usePollWizardStep,
  usePollWizardActions,
  pollWizardStoreUtils,
  pollWizardStoreDebug
} from './pollWizardStore';

// App Store
export {
  useAppStore,
  useApp,
  useAppState,
  useAppActions,
  appStoreUtils,
  appStoreDebug
} from './appStore';

// Store types
export type {
  FeedItem,
  FeedCategory,
  FeedFilters,
  FeedPreferences,
  FeedSearch,
  FeedsStore
} from './feedsStore';

// Store middleware
export { storeMiddleware } from './middleware';