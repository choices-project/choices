/**
 * Admin Feature Types
 * 
 * Consolidated type definitions for the admin feature.
 * All admin-related types should be defined here to ensure consistency
 * and avoid duplication across the feature.
 * 
 * Created: December 19, 2024
 * Updated: December 19, 2024
 */

// ============================================================================
// Core Admin Types
// ============================================================================

/**
 * Admin notification for system alerts and user actions
 */
export interface AdminNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

/**
 * Trending topic data for admin dashboard
 */
export interface TrendingTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  trending_score: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * Generated poll data for admin management
 */
export interface GeneratedPoll {
  id: string;
  title: string;
  description: string;
  options: string[];
  category: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * System metrics for admin dashboard
 */
export interface SystemMetrics {
  total_topics: number;
  total_polls: number;
  active_polls: number;
  system_health: 'healthy' | 'warning' | 'critical';
  last_updated: string;
  performance_metrics?: {
    response_time_avg: number;
    error_rate: number;
    active_users: number;
  };
}

/**
 * Activity item for admin activity feed
 */
export interface ActivityItem {
  id: string;
  type: 'topic_created' | 'topic_updated' | 'poll_created' | 'poll_updated' | 'system_alert' | 'user_action';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Performance Monitoring Types
// ============================================================================

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * System performance alert
 */
export interface SystemPerformanceAlert {
  id: string;
  type: 'slow_query' | 'high_error_rate' | 'memory_usage' | 'database_connection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
  resolved: boolean;
}

/**
 * Performance report data
 */
export interface PerformanceReport {
  period: string;
  totalOperations: number;
  averageResponseTime: number;
  errorRate: number;
  slowestOperations: PerformanceMetric[];
  alerts: SystemPerformanceAlert[];
  recommendations: string[];
  generated_at: string;
}

// ============================================================================
// User Management Types
// ============================================================================

/**
 * User data for admin management
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login?: string;
  metadata?: Record<string, any>;
}

/**
 * User suggestion for admin review
 */
export interface UserSuggestion {
  id: string;
  user_id: string;
  type: 'poll' | 'topic' | 'feature' | 'bug';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// User Journey & Feedback Types
// ============================================================================

/**
 * User journey data for analytics
 */
export interface UserJourney {
  // Current page context
  currentPage: string;
  currentPath: string;
  pageTitle: string;
  referrer: string;
  
  // User interaction context
  userAgent: string;
  screenResolution: string;
  viewportSize: string;
  timeOnPage: number;
  
  // Session context
  sessionId: string;
  sessionStartTime: string;
  totalPageViews: number;
  
  // Feature usage context
  activeFeatures: string[];
  lastAction: string;
  actionSequence: string[];
  
  // Performance context
  pageLoadTime: number;
  performanceMetrics: {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
  };
  
  // Error context
  errors: Array<{
    type: string;
    message: string;
    stack?: string;
    timestamp: string;
  }>;
  
  // Device context
  deviceInfo: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
    language: string;
    timezone: string;
  };
  
  // Authentication context
  isAuthenticated: boolean;
  userRole?: string;
  userId?: string;
}

/**
 * Individual journey event
 */
export interface JourneyEvent {
  id: string;
  type: string;
  timestamp: string;
  data?: Record<string, any>;
}

/**
 * Feedback context for user feedback
 */
export interface FeedbackContext {
  // Feedback metadata
  feedbackId: string;
  timestamp: string;
  source: 'widget' | 'page' | 'api' | 'admin';
  
  // User journey snapshot
  userJourney: UserJourney;
  
  // Feedback content
  type: 'bug' | 'feature' | 'general' | 'performance' | 'accessibility' | 'security';
  title: string;
  description: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  
  // Categorization
  category: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  severity?: 'minor' | 'moderate' | 'major' | 'critical';
  
  // Additional context
  screenshot?: string;
  consoleLogs?: string[];
  networkRequests?: Array<{
    url: string;
    method: string;
    status: number;
    duration: number;
  }>;
  
  // AI analysis fields
  aiAnalysis: {
    intent: string;
    category: string;
    sentiment: number;
    urgency: number;
    complexity: number;
    keywords: string[];
    suggestedActions: string[];
  };
}

// ============================================================================
// System Settings Types
// ============================================================================

/**
 * System settings configuration
 */
export interface SystemSettings {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  category: string;
  updated_at: string;
  updated_by: string;
}

// ============================================================================
// Audit & Logging Types
// ============================================================================

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

// ============================================================================
// Reimport & Data Management Types
// ============================================================================

/**
 * Reimport progress tracking
 */
export interface ReimportProgress {
  id: string;
  type: 'full' | 'incremental' | 'specific';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  total_items: number;
  processed_items: number;
  errors: string[];
  started_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Mock Data Types
// ============================================================================

/**
 * Breaking news story for mock data
 */
export interface BreakingNewsStory {
  id: string;
  title: string;
  summary: string;
  source: string;
  published_at: string;
  category: string;
  trending_score: number;
}

/**
 * Poll context for mock data
 */
export interface PollContext {
  id: string;
  title: string;
  description: string;
  category: string;
  trending_score: number;
  created_at: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Admin dashboard component props
 */
export interface AdminDashboardProps {
  className?: string;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  total_users: number;
  active_polls: number;
  trending_topics: number;
  system_health: 'healthy' | 'warning' | 'critical';
}

/**
 * Performance dashboard props
 */
export interface PerformanceDashboardProps {
  className?: string;
}

/**
 * Analytics panel props
 */
export interface AnalyticsPanelProps {
  className?: string;
}

/**
 * Analytics data structure
 */
export interface AnalyticsData {
  users: {
    total: number;
    active: number;
    new: number;
  };
  polls: {
    total: number;
    active: number;
    completed: number;
  };
  topics: {
    total: number;
    trending: number;
  };
  performance: {
    response_time: number;
    error_rate: number;
    uptime: number;
  };
}

/**
 * User management props
 */
export interface UserManagementProps {
  className?: string;
}

/**
 * System settings props
 */
export interface SystemSettingsProps {
  className?: string;
}

/**
 * Admin layout props
 */
export interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// Store Types
// ============================================================================

/**
 * Admin store state interface
 */
export interface AdminStore {
  // UI State
  sidebarCollapsed: boolean;
  currentPage: string;
  
  // Data
  notifications: AdminNotification[];
  trendingTopics: TrendingTopic[];
  generatedPolls: GeneratedPoll[];
  systemMetrics: SystemMetrics | null;
  activityItems: ActivityItem[];
  activityFeed: ActivityItem[];
  
  // Actions
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setTrendingTopics: (topics: TrendingTopic[]) => void;
  setGeneratedPolls: (polls: GeneratedPoll[]) => void;
  setSystemMetrics: (metrics: SystemMetrics) => void;
  addActivityItem: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  clearActivityItems: () => void;
  
  // Legacy methods for backward compatibility
  updateTrendingTopics: (topics: TrendingTopic[]) => void;
  updateGeneratedPolls: (polls: GeneratedPoll[]) => void;
  updateSystemMetrics: (metrics: SystemMetrics) => void;
  updateActivityFeed: (activities: ActivityItem[]) => void;
  setLoading: (key: string, loading: boolean) => void;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Paginated response wrapper
 */
export type PaginatedResponse<T = any> = ApiResponse<T[]> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// ============================================================================
// Feature Flag Management Types
// ============================================================================

/**
 * Feature flag configuration for admin management
 */
export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  category: string;
  key: string;
}

/**
 * Feature flag configuration export/import
 */
export interface FeatureFlagConfig {
  flags: Record<string, boolean>;
  timestamp: string;
  version: string;
}

/**
 * Feature flag management state
 */
export interface FeatureFlagState {
  flags: Record<string, boolean>;
  enabledFlags: string[];
  disabledFlags: string[];
  categories: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Admin Store Interface
// ============================================================================

/**
 * Main admin store interface
 */
export interface AdminStore {
  // UI State
  sidebarCollapsed: boolean;
  currentPage: string;
  notifications: AdminNotification[];
  
  // Data State
  trendingTopics: TrendingTopic[];
  generatedPolls: GeneratedPoll[];
  systemMetrics: SystemMetrics;
  activityItems: ActivityItem[];
  activityFeed: ActivityItem[];
  
  // Feature Flag State
  featureFlags: FeatureFlagState;
  
  // UI Actions
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Data Actions
  setTrendingTopics: (topics: TrendingTopic[]) => void;
  setGeneratedPolls: (polls: GeneratedPoll[]) => void;
  setSystemMetrics: (metrics: SystemMetrics) => void;
  setActivityItems: (items: ActivityItem[]) => void;
  setActivityFeed: (items: ActivityItem[]) => void;
  
  // Feature Flag Actions
  enableFeatureFlag: (flagId: string) => boolean;
  disableFeatureFlag: (flagId: string) => boolean;
  toggleFeatureFlag: (flagId: string) => boolean;
  isFeatureFlagEnabled: (flagId: string) => boolean;
  getFeatureFlag: (flagId: string) => FeatureFlag | null;
  getAllFeatureFlags: () => FeatureFlag[];
  exportFeatureFlagConfig: () => FeatureFlagConfig;
  importFeatureFlagConfig: (config: FeatureFlagConfig) => boolean;
  resetFeatureFlags: () => void;
  setFeatureFlagLoading: (loading: boolean) => void;
  setFeatureFlagError: (error: string | null) => void;
}

// ============================================================================
// Feature Flag Management Types
// ============================================================================

/**
 * Feature flag configuration for admin management
 */
export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  category: string;
  key: string;
}

/**
 * Feature flag configuration export/import
 */
export interface FeatureFlagConfig {
  flags: Record<string, boolean>;
  timestamp: string;
  version: string;
}

/**
 * Feature flag management state
 */
export interface FeatureFlagState {
  flags: Record<string, boolean>;
  enabledFlags: string[];
  disabledFlags: string[];
  categories: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Admin Store Interface
// ============================================================================

/**
 * Main admin store interface
 */
export interface AdminStore {
  // UI State
  sidebarCollapsed: boolean;
  currentPage: string;
  notifications: AdminNotification[];
  
  // Data State
  trendingTopics: TrendingTopic[];
  generatedPolls: GeneratedPoll[];
  systemMetrics: SystemMetrics;
  activityItems: ActivityItem[];
  activityFeed: ActivityItem[];
  
  // Feature Flag State
  featureFlags: FeatureFlagState;
  
  // UI Actions
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Data Actions
  setTrendingTopics: (topics: TrendingTopic[]) => void;
  setGeneratedPolls: (polls: GeneratedPoll[]) => void;
  setSystemMetrics: (metrics: SystemMetrics) => void;
  setActivityItems: (items: ActivityItem[]) => void;
  setActivityFeed: (items: ActivityItem[]) => void;
  
  // Feature Flag Actions
  enableFeatureFlag: (flagId: string) => boolean;
  disableFeatureFlag: (flagId: string) => boolean;
  toggleFeatureFlag: (flagId: string) => boolean;
  isFeatureFlagEnabled: (flagId: string) => boolean;
  getFeatureFlag: (flagId: string) => FeatureFlag | null;
  getAllFeatureFlags: () => FeatureFlag[];
  exportFeatureFlagConfig: () => FeatureFlagConfig;
  importFeatureFlagConfig: (config: FeatureFlagConfig) => boolean;
  resetFeatureFlags: () => void;
  setFeatureFlagLoading: (loading: boolean) => void;
  setFeatureFlagError: (error: string | null) => void;
}

// ============================================================================
// Feature Flag Management Types
// ============================================================================

/**
 * Feature flag configuration for admin management
 */
export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  category: string;
  key: string;
}

/**
 * Feature flag configuration export/import
 */
export interface FeatureFlagConfig {
  flags: Record<string, boolean>;
  timestamp: string;
  version: string;
}

/**
 * Feature flag management state
 */
export interface FeatureFlagState {
  flags: Record<string, boolean>;
  enabledFlags: string[];
  disabledFlags: string[];
  categories: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Admin Store Interface
// ============================================================================

/**
 * Main admin store interface
 */
export interface AdminStore {
  // UI State
  sidebarCollapsed: boolean;
  currentPage: string;
  notifications: AdminNotification[];
  
  // Data State
  trendingTopics: TrendingTopic[];
  generatedPolls: GeneratedPoll[];
  systemMetrics: SystemMetrics;
  activityItems: ActivityItem[];
  activityFeed: ActivityItem[];
  
  // Feature Flag State
  featureFlags: FeatureFlagState;
  
  // UI Actions
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: Omit<AdminNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Data Actions
  setTrendingTopics: (topics: TrendingTopic[]) => void;
  setGeneratedPolls: (polls: GeneratedPoll[]) => void;
  setSystemMetrics: (metrics: SystemMetrics) => void;
  setActivityItems: (items: ActivityItem[]) => void;
  setActivityFeed: (items: ActivityItem[]) => void;
  
  // Feature Flag Actions
  enableFeatureFlag: (flagId: string) => boolean;
  disableFeatureFlag: (flagId: string) => boolean;
  toggleFeatureFlag: (flagId: string) => boolean;
  isFeatureFlagEnabled: (flagId: string) => boolean;
  getFeatureFlag: (flagId: string) => FeatureFlag | null;
  getAllFeatureFlags: () => FeatureFlag[];
  exportFeatureFlagConfig: () => FeatureFlagConfig;
  importFeatureFlagConfig: (config: FeatureFlagConfig) => boolean;
  resetFeatureFlags: () => void;
  setFeatureFlagLoading: (loading: boolean) => void;
  setFeatureFlagError: (error: string | null) => void;
}
