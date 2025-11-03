/**
 * Analytics Feature Exports
 * Enhanced analytics with new schema capabilities
 * Created: 2025-10-27
 */

// Components
export { default as EnhancedAnalyticsDashboard } from './components/EnhancedAnalyticsDashboard';
export { default as FeedbackWidget } from '@/components/EnhancedFeedbackWidget';
export { ProfessionalChart } from './components/ProfessionalChart';

// Hooks
export { useEnhancedAnalytics } from './hooks/useEnhancedAnalytics';

// Services
export { EnhancedAnalyticsService } from './lib/enhanced-analytics-service';
export { AnalyticsEngine } from './lib/AnalyticsEngine';
export { AuthAnalytics } from './lib/auth-analytics';

// Types
export type { 
  TrustTierAnalytics,
  PollDemographicInsights,
  CivicDatabaseEntry,
  TrustTierHistoryEntry,
  TrustTier,
  TrustTierScore,
  AnalyticsFilters,
  AnalyticsSummary,
  PollAnalytics,
  UserAnalytics,
  AnalyticsExport,
  AnalyticsDashboard
} from './types/analytics';

// Utilities
export * from './lib/minimal';
