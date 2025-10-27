/**
 * Admin Feature Types
 * 
 * Type definitions for admin feature management
 */

export interface PerformanceMetric {
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

export interface SystemPerformanceAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface PerformanceReport {
  id: string;
  report_name: string;
  generated_at: string;
  metrics: PerformanceMetric[];
  alerts: SystemPerformanceAlert[];
  totalOperations: number;
}

export interface TrendingTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  trending_score: number;
  created_at: string;
  updated_at: string;
}

export interface GeneratedPoll {
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

export interface SystemMetrics {
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
}

export interface BreakingNewsStory {
  id: string;
  title: string;
  summary: string;
  source: string;
  published_at: string;
}

export interface PollContext {
  id: string;
  poll_id: string;
  context: string;
  created_at: string;
}

export interface UserJourney {
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

export interface FeedbackContext {
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

export interface AdminNotification {
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

export interface FeatureFlag {
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

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
}

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  memory_usage: number;
  cpu_usage: number;
  disk_usage: number;
  last_updated: string;
}
