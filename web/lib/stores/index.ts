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
  useUserLoading,
  useUserError,
  useUserActions,
  useUserCurrentAddress,
  useUserCurrentState,
  useUserRepresentatives,
  useUserShowAddressForm,
  useUserNewAddress,
  useUserAddressLoading,
  useUserSavedSuccessfully,
  useUserProfileEditData,
  useUserIsProfileEditing,
  useUserProfileEditErrors,
  useUserAvatarFile,
  useUserAvatarPreview,
  useUserIsUploadingAvatar,
  userStoreUtils,
  userStoreDebug
} from './userStore';

// Admin Store
export {
  useAdminStore,
  useTrendingTopics,
  useGeneratedPolls,
  useSystemMetrics,
  useActivityItems,
  useActivityFeed,
  useAdminNotifications,
  useAdminLoading,
  useAdminError,
  useAdminUsers,
  useAdminUserFilters,
  useAdminUserActions,
  useAdminActiveTab,
  useAdminDashboardStats,
  useAdminDashboardActions,
  useAdminSystemSettings,
  useAdminSettingsTab,
  useAdminIsSavingSettings,
  useAdminSystemSettingsActions,
  useAdminReimportProgress,
  useAdminReimportLogs,
  useAdminIsReimportRunning,
  useAdminReimportActions,
  useAdminActions,
  useAdminStats,
  useRecentActivity,
  adminStoreUtils,
  adminStoreDebug
} from './adminStore';

// Voting Store
export {
  useVotingStore,
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
  onboardingStoreUtils,
  onboardingStoreDebug
} from './onboardingStore';

// PWA Store
export {
  usePWAStore,
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
  useUnreadNotifications,
  useHighPriorityNotifications,
  pwaStoreUtils,
  pwaStoreDebug
} from './pwaStore';

// Performance Store
export {
  usePerformanceStore,
  usePerformance,
  usePerformanceMetrics,
  usePerformanceActions,
  usePerformanceLoading,
  usePerformanceError,
  useDatabaseMetrics,
  useCacheStats,
  useLastRefresh,
  useAutoRefresh,
  useRefreshInterval
} from './performanceStore';

// Analytics Store
export {
  useAnalyticsStore,
  useAnalyticsEvents,
  useAnalyticsMetrics,
  useAnalyticsBehavior,
  useAnalyticsDashboard,
  useAnalyticsPreferences,
  useAnalyticsTracking,
  useAnalyticsLoading,
  useAnalyticsError,
  useAnalyticsChartData,
  useAnalyticsChartConfig,
  useAnalyticsChartMaxValue,
  useAnalyticsChartShowTrends,
  useAnalyticsChartShowConfidence,
  useAnalyticsActions,
  useAnalyticsStats,
  useAnalyticsSession,
  useAnalyticsChartContext,
  analyticsStoreUtils,
  analyticsStoreDebug
} from './analyticsStore';

// Civics Store
export {
  useCivicsStore,
  useCivicsActions,
  useCivicsLoading,
  civicsStoreUtils,
  civicsStoreDebug
} from './civicsStore';

// Device Store
export {
  useDeviceStore,
  useDevice,
  useDeviceActions
} from './deviceStore';

// Polls Store
export {
  usePollsStore,
  usePolls,
  usePollsActions,
  usePollsLoading,
  usePollsError,
  pollsStoreUtils,
  pollsStoreDebug
} from './pollsStore';

// Profile Store
export {
  useProfileStore,
  useProfile,
  useProfileActions,
  useProfileDisplay,
  useProfileValidation,
  useProfileStats,
  profileSelectors,
  profileStoreSubscriptions,
  profileStoreUtils,
  profileStoreDebug
} from './profileStore';

// Hashtag Store
export {
  useHashtagStore,
  useHashtags,
  useHashtagActions,
  useHashtagStats,
  useHashtagLoading,
  useHashtagError,
  useHashtagFilters,
  hashtagStoreUtils,
  hashtagStoreDebug
} from './hashtagStore';

// Hashtag Moderation Store
export {
  useHashtagModerationStore,
  useModerationModal,
  useModerationForm,
  useModerationQueue,
  useSelectedModeration,
  useModerationLoading,
  useModerationError,
  useModerationActions,
  useModerationStats,
  usePendingFlags
} from './hashtagModerationStore';

// Poll Wizard Store
export {
  usePollWizardStore,
  usePollWizardData,
  usePollWizardProgress,
  usePollWizardLoading,
  usePollWizardErrors,
  usePollWizardCanProceed,
  usePollWizardCanGoBack,
  usePollWizardIsComplete,
  usePollWizardActions,
  usePollWizardStats,
  pollWizardStoreUtils,
  pollWizardStoreDebug
} from './pollWizardStore';

// App Store
export {
  useAppStore,
  useAppLoading,
  useAppError,
  useAppActions,
  useAppTheme,
  useAppLanguage,
  useAppTimezone,
  useAppAnimations,
  useAppHaptics,
  appStoreUtils,
  appStoreDebug
} from './appStore';

// UI Store removed - use App Store for global UI state

// Optimized Selectors
export * from './selectors';

// Store types - Note: These types are not exported from feedsStore
// export type {
//   FeedItem,
//   FeedCategory,
//   FeedFilters,
//   FeedPreferences,
//   FeedSearch,
//   FeedsStore
// } from './feedsStore';

// Store middleware
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
  developmentMiddleware,
  productionMiddleware,
  storeDebug,
  storeTest,
  storeDocumentation
} from './middleware';