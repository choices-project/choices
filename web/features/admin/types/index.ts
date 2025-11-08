/**
 * Admin Feature Types
 *
 * Type definitions for admin feature management
 */

import type {
  FeatureFlag as CoreFeatureFlag,
  FeatureFlagConfig as CoreFeatureFlagConfig,
} from '@/lib/core/feature-flags';

export type PerformanceMetric = {
  id?: string;
  metric_name?: string;
  metric_value?: number;
  timestamp: string;
  threshold?: number;
  operation?: string;
  duration?: number;
  success?: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
};

export type SystemPerformanceAlert = {
  id: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  metadata?: Record<string, unknown>;
};

export type PerformanceReport = {
  id?: string;
  report_name?: string;
  generated_at: string;
  metrics?: PerformanceMetric[];
  alerts: SystemPerformanceAlert[];
  totalOperations: number;
  period: string;
  averageResponseTime: number;
  errorRate: number;
  slowestOperations: PerformanceMetric[];
  recommendations: string[];
};

export type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
};

export type FeatureFlag = CoreFeatureFlag;
export type FeatureFlagConfig = CoreFeatureFlagConfig;

export type TrackedErrorType = 'javascript' | 'promise' | 'network';

export type TrackedError = {
  type: TrackedErrorType;
  message: string;
  stack?: string;
  timestamp: string;
  duration?: number;
  details?: Record<string, unknown>;
};

export type TrackedNetworkRequest = {
  url: string;
  method: string;
  status: number;
  duration: number;
};

export type PerformanceMetricsSnapshot = {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  pageLoadTime?: number;
  timeOnPage?: number;
  networkRequests?: TrackedNetworkRequest[];
};

export type DeviceInfo = {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  browser: string;
  os: string;
  language: string;
  timezone: string;
  screenResolution: string;
  viewportSize: string;
  userAgent: string;
};

export type AdminFeatureFlagCategories = {
  core: string[];
  enhanced: string[];
  civics: string[];
  future: string[];
  performance: string[];
};

export type AdminFeatureFlagsState = {
  flags: Record<string, boolean>;
  enabledFlags: string[];
  disabledFlags: string[];
  categories: AdminFeatureFlagCategories;
  isLoading: boolean;
  error: string | null;
};

export type TrendingTopic = {
  id: string;
  title: string;
  description: string;
  category: string;
  trending_score: number;
  created_at: string;
  updated_at: string;
};

export type GeneratedPoll = {
  id: string;
  title: string;
  description: string;
  question?: string;
  options: string[];
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SystemMetrics = {
  total_topics: number;
  total_polls: number;
  total_users?: number;
  total_votes?: number;
  active_sessions?: number;
  active_polls: number;
  system_uptime?: number;
  memory_usage?: number;
  cpu_usage?: number;
  disk_usage?: number;
  system_health: string;
  last_updated: string;
  performance_metrics?: {
    response_time_avg: number;
    error_rate: number;
    throughput: number;
  };
};

export type BreakingNewsStory = {
  id: string;
  title: string;
  summary: string;
  source: string;
  published_at: string;
};

export type PollContext = {
  id: string;
  poll_id: string;
  context: string;
  created_at: string;
};

export type UserJourney = {
  id?: string;
  user_id?: string;
  step?: string;
  timestamp?: string;
  currentPage: string;
  currentPath: string;
  pageTitle: string;
  referrer: string;
  userAgent: string;
  screenResolution: string;
  viewportSize: string;
  timeOnPage: number;
  sessionId: string;
  sessionStartTime: string;
  totalPageViews: number;
  activeFeatures: string[];
  lastAction: string;
  actionSequence: string[];
  pageLoadTime: number;
  performanceMetrics: PerformanceMetricsSnapshot;
  errors: TrackedError[];
  deviceInfo: DeviceInfo;
  isAuthenticated: boolean;
  userRole?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
};

export type FeedbackAiAnalysis = {
  intent: string;
  category: string;
  sentiment: number;
  urgency: number;
  complexity: number;
  keywords: string[];
  suggestedActions: string[];
};

export type FeedbackContext = {
  id?: string;
  user_id?: string;
  context?: string;
  feedback?: string;
  rating?: number;
  created_at?: string;
  feedbackId: string;
  timestamp: string;
  source: string;
  userJourney: UserJourney;
  type: string;
  title: string;
  description: string;
  sentiment: string;
  category: string[];
  priority: string;
  severity: string;
  consoleLogs: string[];
  networkRequests: TrackedNetworkRequest[];
  aiAnalysis: FeedbackAiAnalysis | null;
  screenshot?: string;
};

export type AdminNotification = {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action?: {
    url: string;
    label: string;
  };
  metadata?: Record<string, unknown>;
};

export type NewAdminNotification = Pick<AdminNotification, 'type' | 'title' | 'message'> &
  Partial<Pick<AdminNotification, 'read' | 'action' | 'metadata' | 'timestamp' | 'created_at'>>;

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
};

export type SystemStatus = {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  memory_usage: number;
  cpu_usage: number;
  disk_usage: number;
  last_updated: string;
};

export type AdminStoreState = {
  sidebarCollapsed: boolean;
  currentPage: string;
  notifications: AdminNotification[];
  trendingTopics: TrendingTopic[];
  generatedPolls: GeneratedPoll[];
  systemMetrics: SystemMetrics;
  activityItems: ActivityItem[];
  activityFeed: ActivityItem[];
  featureFlags: AdminFeatureFlagsState;
};

export type AdminStoreActions = {
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: NewAdminNotification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setTrendingTopics: (topics: TrendingTopic[]) => void;
  setGeneratedPolls: (polls: GeneratedPoll[]) => void;
  setSystemMetrics: (metrics: SystemMetrics) => void;
  addActivityItem: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  clearActivityItems: () => void;
  updateTrendingTopics: (topics: TrendingTopic[]) => void;
  updateGeneratedPolls: (polls: GeneratedPoll[]) => void;
  updateSystemMetrics: (metrics: SystemMetrics) => void;
  updateActivityFeed: (activities: ActivityItem[]) => void;
  setLoading: (key: string, loading: boolean) => void;
  enableFeatureFlag: (flagId: string) => boolean;
  disableFeatureFlag: (flagId: string) => boolean;
  toggleFeatureFlag: (flagId: string) => boolean;
  isFeatureFlagEnabled: (flagId: string) => boolean;
  getFeatureFlag: (flagId: string) => FeatureFlag | null;
  getAllFeatureFlags: () => FeatureFlag[];
  exportFeatureFlagConfig: () => FeatureFlagConfig;
  importFeatureFlagConfig: (config: unknown) => boolean;
  resetFeatureFlags: () => void;
  setFeatureFlagLoading: (loading: boolean) => void;
  setFeatureFlagError: (error: string | null) => void;
};

export type AdminStore = AdminStoreState & AdminStoreActions;

export type AdminRealtimeEvent =
  | { type: 'system-metrics'; payload: SystemMetrics }
  | { type: 'notification'; payload: AdminNotification }
  | { type: 'activity'; payload: ActivityItem };

export type FeedbackRealtimeEvent =
  | { type: 'feedback-received'; payload: FeedbackContext }
  | { type: 'feedback-updated'; payload: FeedbackContext };

export type AdminRealtimeSubscriptionCallback = (event: AdminRealtimeEvent) => void;
export type FeedbackRealtimeSubscriptionCallback = (event: FeedbackRealtimeEvent) => void;
