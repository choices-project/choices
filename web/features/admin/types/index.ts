/**
 * Admin Feature Types
 * 
 * Type definitions for admin feature management
 */

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
  metadata?: Record<string, any>;
}

export type SystemPerformanceAlert = {
  id: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  metadata?: Record<string, any>;
}

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
}

export type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

export type AdminStore = {
  // Store interface properties
  [key: string]: any;
}

export type FeatureFlagConfig = {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  flags?: FeatureFlag[];
  categories?: string[];
  environment?: string;
  version?: string;
}

export type TrendingTopic = {
  id: string;
  title: string;
  description: string;
  category: string;
  trending_score: number;
  created_at: string;
  updated_at: string;
}

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
}

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
}

export type BreakingNewsStory = {
  id: string;
  title: string;
  summary: string;
  source: string;
  published_at: string;
}

export type PollContext = {
  id: string;
  poll_id: string;
  context: string;
  created_at: string;
}

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
  performanceMetrics: {
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
  };
  errors: string[];
  deviceInfo: {
    deviceType: string;
    browser: string;
    platform: string;
  };
  isAuthenticated: boolean;
  userRole?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

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
  networkRequests: any[];
  aiAnalysis: any;
  screenshot?: string;
}

export type AdminNotification = {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action?: {
    url: string;
    label: string;
  };
  metadata?: Record<string, any>;
}

export type FeatureFlag = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: Record<string, any>;
}

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
}

export type SystemStatus = {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  memory_usage: number;
  cpu_usage: number;
  disk_usage: number;
  last_updated: string;
}
