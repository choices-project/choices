/**
 * Real-time service for the admin experience.
 *
 * Integrates with Supabase Realtime channels to deliver
 * live admin notifications, activity events, and feedback updates.
 */

import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from '@supabase/supabase-js';

import { logger } from '@/lib/utils/logger';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';
import type { Database } from '@/utils/supabase/client';

import type {
  ActivityItem,
  AdminNotification,
  AdminRealtimeSubscriptionCallback,
  DeviceInfo,
  FeedbackAiAnalysis,
  FeedbackContext,
  FeedbackRealtimeSubscriptionCallback,
  PerformanceMetricsSnapshot,
  SystemMetrics,
  TrackedError,
  TrackedNetworkRequest,
  UserJourney,
} from '../types';

type FeedbackRow = Database['public']['Tables']['feedback']['Row'];
type AdminActivityRow = Database['public']['Tables']['admin_activity_log']['Row'];

type AdminNotificationRow = Record<string, unknown>;

const isBrowser = () => typeof window !== 'undefined';

const ADMIN_CHANNEL_PREFIX = 'admin-updates';
const FEEDBACK_CHANNEL_PREFIX = 'feedback-updates';

const subscriptions = new Map<string, RealtimeChannel>();

let supabaseClientPromise: Promise<SupabaseClient<Database>> | null = null;
let activeMetricsController: AbortController | null = null;

const ensureSupabaseClient = async (): Promise<SupabaseClient<Database>> => {
  if (!supabaseClientPromise) {
    supabaseClientPromise = getSupabaseBrowserClient().catch((error) => {
      supabaseClientPromise = null;
      throw error;
    });
  }
  return supabaseClientPromise;
};

const createSubscriptionId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}:${crypto.randomUUID()}`;
  }
  return `${prefix}:${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (value: unknown, fallback: string = ''): string => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
};

const getOptionalString = (value: unknown): string | undefined => {
  const result = getString(value);
  return result ? result : undefined;
};

const getNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const getOptionalNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const normalizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const results = value
    .map((entry) => getString(entry))
    .filter((entry) => entry.length > 0);
  return results.length > 0 ? results : undefined;
};

const normalizeNetworkRequests = (value: unknown): TrackedNetworkRequest[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  const requests: TrackedNetworkRequest[] = [];
  value.forEach((entry) => {
    if (!isRecord(entry)) {
      return;
    }
    const url = getString(entry.url);
    if (!url) {
      return;
    }
    requests.push({
      url,
      method: getString(entry.method, 'GET'),
      status: getNumber(entry.status, 0),
      duration: getNumber(entry.duration, 0),
    });
  });
  return requests;
};

const normalizeErrors = (value: unknown): TrackedError[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  const errors: TrackedError[] = [];
  value.forEach((entry) => {
    if (!isRecord(entry)) {
      return;
    }
    const typeValue = getString(entry.type, 'javascript').toLowerCase();
    const type: TrackedError['type'] =
      typeValue === 'promise' || typeValue === 'network' ? typeValue : 'javascript';

    const message = getString(entry.message);
    if (!message) {
      return;
    }

    const record: TrackedError = {
      type,
      message,
      timestamp: getString(entry.timestamp, new Date().toISOString()),
    };

    const stack = getOptionalString(entry.stack);
    if (stack) {
      record.stack = stack;
    }

    const duration = getOptionalNumber(entry.duration);
    if (typeof duration === 'number') {
      record.duration = duration;
    }

    if (isRecord(entry.details)) {
      record.details = entry.details;
    }

    errors.push(record);
  });
  return errors;
};

const normalizePerformanceMetrics = (value: unknown): PerformanceMetricsSnapshot => {
  const metrics: PerformanceMetricsSnapshot = {};

  if (!isRecord(value)) {
    return metrics;
  }

  const fcp = getOptionalNumber(value.fcp);
  if (typeof fcp === 'number') {
    metrics.fcp = fcp;
  }

  const lcp = getOptionalNumber(value.lcp);
  if (typeof lcp === 'number') {
    metrics.lcp = lcp;
  }

  const fid = getOptionalNumber(value.fid);
  if (typeof fid === 'number') {
    metrics.fid = fid;
  }

  const cls = getOptionalNumber(value.cls);
  if (typeof cls === 'number') {
    metrics.cls = cls;
  }

  const pageLoadTime = getOptionalNumber(value.pageLoadTime ?? value.page_load_time);
  if (typeof pageLoadTime === 'number') {
    metrics.pageLoadTime = pageLoadTime;
  }

  const timeOnPage = getOptionalNumber(value.timeOnPage ?? value.time_on_page);
  if (typeof timeOnPage === 'number') {
    metrics.timeOnPage = timeOnPage;
  }

  metrics.networkRequests = normalizeNetworkRequests(
    value.networkRequests ?? value.network_requests
  );

  return metrics;
};

const normalizeDeviceInfo = (value: unknown): DeviceInfo => {
  const base: DeviceInfo = {
    deviceType: 'desktop',
    platform: 'unknown',
    browser: 'unknown',
    os: 'unknown',
    language:
      typeof navigator !== 'undefined'
        ? navigator.language
        : 'en-US',
    timezone:
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'
        : 'UTC',
    screenResolution: 'unknown',
    viewportSize: 'unknown',
    userAgent:
      typeof navigator !== 'undefined'
        ? navigator.userAgent
        : 'unknown',
  };

  if (!isRecord(value)) {
    return base;
  }

  const deviceType = getString(value.deviceType ?? value.device_type, base.deviceType).toLowerCase();
  const normalizedDeviceType: DeviceInfo['deviceType'] =
    deviceType === 'mobile' || deviceType === 'tablet' ? deviceType : 'desktop';

  return {
    ...base,
    deviceType: normalizedDeviceType,
    platform: getString(value.platform, base.platform),
    browser: getString(value.browser, base.browser),
    os: getString(value.os, base.os),
    language: getString(value.language, base.language),
    timezone: getString(value.timezone ?? value.time_zone, base.timezone),
    screenResolution: getString(value.screenResolution ?? value.screen_resolution, base.screenResolution),
    viewportSize: getString(value.viewportSize ?? value.viewport_size, base.viewportSize),
    userAgent: getString(value.userAgent ?? value.user_agent, base.userAgent),
  };
};

const normalizeAiAnalysis = (value: unknown): FeedbackAiAnalysis | null => {
  if (!isRecord(value)) {
    return null;
  }
  return {
    intent: getString(value.intent),
    category: getString(value.category),
    sentiment: getNumber(value.sentiment, 0),
    urgency: getNumber(value.urgency, 0),
    complexity: getNumber(value.complexity, 0),
    keywords: normalizeStringArray(value.keywords) ?? [],
    suggestedActions: normalizeStringArray(value.suggestedActions ?? value.suggested_actions) ?? [],
  };
};

const normalizeUserJourney = (value: unknown): UserJourney => {
  const base: UserJourney = {
    currentPage: '',
    currentPath: '',
    pageTitle: '',
    referrer: '',
    userAgent:
      typeof navigator !== 'undefined'
        ? navigator.userAgent
        : 'unknown',
    screenResolution: 'unknown',
    viewportSize: 'unknown',
    timeOnPage: 0,
    sessionId: `session_${Math.random().toString(36).slice(2)}`,
    sessionStartTime: new Date().toISOString(),
    totalPageViews: 0,
    activeFeatures: [],
    lastAction: 'none',
    actionSequence: [],
    pageLoadTime: 0,
    performanceMetrics: {},
    errors: [],
    deviceInfo: normalizeDeviceInfo(undefined),
    isAuthenticated: false,
  };

  if (!isRecord(value)) {
    return base;
  }

  const journey: UserJourney = {
    ...base,
    currentPage: getString(value.currentPage ?? value.page ?? value.path, base.currentPage),
    currentPath: getString(value.currentPath ?? value.url, base.currentPath),
    pageTitle: getString(value.pageTitle ?? value.title, base.pageTitle),
    referrer: getString(value.referrer, base.referrer),
    userAgent: getString(value.userAgent ?? value.user_agent, base.userAgent),
    screenResolution: getString(value.screenResolution ?? value.screen_resolution, base.screenResolution),
    viewportSize: getString(value.viewportSize ?? value.viewport_size, base.viewportSize),
    timeOnPage: getNumber(value.timeOnPage ?? value.time_on_page, base.timeOnPage),
    sessionId: getString(value.sessionId ?? value.session_id, base.sessionId),
    sessionStartTime: getString(value.sessionStartTime ?? value.session_start_time, base.sessionStartTime),
    totalPageViews: getNumber(value.totalPageViews ?? value.total_page_views, base.totalPageViews),
    activeFeatures: normalizeStringArray(value.activeFeatures ?? value.active_features) ?? base.activeFeatures,
    lastAction: getString(value.lastAction, base.lastAction),
    actionSequence: normalizeStringArray(value.actionSequence ?? value.action_sequence) ?? base.actionSequence,
    pageLoadTime: getNumber(value.pageLoadTime ?? value.page_load_time, base.pageLoadTime),
    performanceMetrics: normalizePerformanceMetrics(value.performanceMetrics ?? value.performance_metrics),
    errors: normalizeErrors(value.errors),
    deviceInfo: normalizeDeviceInfo(value.deviceInfo ?? value.device_info),
    isAuthenticated: typeof value.isAuthenticated === 'boolean' ? value.isAuthenticated : base.isAuthenticated,
  };

  const userRole = getOptionalString(value.userRole ?? value.user_role ?? value.role);
  if (userRole) {
    journey.userRole = userRole;
  }

  const userId = getOptionalString(value.userId ?? value.user_id);
  if (userId) {
    journey.userId = userId;
  }

  if (isRecord(value.metadata)) {
    journey.metadata = value.metadata;
  }

  return journey;
};

const buildFallbackFeedbackContext = (row: FeedbackRow): FeedbackContext => {
  const context: FeedbackContext = {
    feedbackId: row.id,
    timestamp: row.created_at ?? new Date().toISOString(),
    source: 'feedback',
    userJourney: normalizeUserJourney(row.user_journey),
    type: row.feedback_type,
    title: row.title,
    description: row.description,
    sentiment: row.sentiment ?? 'neutral',
    category: Array.isArray(row.tags) ? row.tags : [],
    priority: row.priority ?? 'medium',
    severity: row.severity ?? 'moderate',
    consoleLogs: [],
    networkRequests: [],
    aiAnalysis: normalizeAiAnalysis(row.ai_analysis),
  };

  if (row.screenshot) {
    context.screenshot = row.screenshot;
  }

  return context;
};

const buildFeedbackContextFromMetadata = (
  rawContext: Record<string, unknown>,
  row: FeedbackRow
): FeedbackContext => {
  const userJourneySource =
    (isRecord(rawContext.userJourney) ? rawContext.userJourney : null) ??
    row.user_journey;

  const category =
    normalizeStringArray(rawContext.category) ??
    (Array.isArray(row.tags) ? row.tags : []);

  const consoleLogs = normalizeStringArray(rawContext.consoleLogs) ?? [];
  const networkRequests = normalizeNetworkRequests(rawContext.networkRequests);
  const aiAnalysis = normalizeAiAnalysis(rawContext.aiAnalysis ?? row.ai_analysis);
  const screenshot = getOptionalString(rawContext.screenshot ?? row.screenshot);

  const context: FeedbackContext = {
    feedbackId: getString(rawContext.feedbackId ?? rawContext.id, row.id),
    timestamp: getString(rawContext.timestamp, row.created_at ?? new Date().toISOString()),
    source: getString(rawContext.source, 'widget'),
    userJourney: normalizeUserJourney(userJourneySource),
    type: getString(rawContext.type, row.feedback_type),
    title: getString(rawContext.title, row.title),
    description: getString(rawContext.description, row.description),
    sentiment: getString(rawContext.sentiment, row.sentiment ?? 'neutral'),
    category,
    priority: getString(rawContext.priority, row.priority ?? 'medium'),
    severity: getString(rawContext.severity, row.severity ?? 'moderate'),
    consoleLogs,
    networkRequests,
    aiAnalysis,
  };

  if (screenshot) {
    context.screenshot = screenshot;
  }

  return context;
};

const normalizeFeedbackContext = (row: FeedbackRow): FeedbackContext => {
  const metadata = isRecord(row.metadata) ? row.metadata : {};
  const storedContext =
    (isRecord(metadata.feedbackContext) ? metadata.feedbackContext : null) ??
    (isRecord(metadata.feedback_context) ? metadata.feedback_context : null);

  if (storedContext && isRecord(storedContext)) {
    return buildFeedbackContextFromMetadata(storedContext, row);
  }

  return buildFallbackFeedbackContext(row);
};

const mapNotificationType = (
  typeValue: unknown,
  statusValue: unknown
): AdminNotification['type'] => {
  const candidates = [
    getString(typeValue).toLowerCase(),
    getString(statusValue).toLowerCase(),
  ];

  if (candidates.some((value) => value === 'error' || value === 'critical' || value === 'failed')) {
    return 'error';
  }
  if (candidates.some((value) => value === 'warning' || value === 'alert')) {
    return 'warning';
  }
  if (candidates.some((value) => value === 'success' || value === 'resolved' || value === 'complete')) {
    return 'success';
  }
  return 'info';
};

const normalizeAdminNotification = (
  row: AdminNotificationRow | null
): AdminNotification | null => {
  if (!isRecord(row)) {
    return null;
  }

  const id = getOptionalString(row.id);
  if (!id) {
    return null;
  }

  const createdAt =
    getOptionalString(row.created_at) ??
    getOptionalString(row.timestamp) ??
    new Date().toISOString();

  const metadata =
    (isRecord(row.metadata) ? row.metadata : undefined) ??
    (isRecord(row.data) ? row.data : undefined);

  const actionUrl = getOptionalString(row.action_url ?? row.actionUrl);
  const actionLabel = getString(row.action_label ?? row.actionLabel, 'View');

  const statusValue = getString(row.status).toLowerCase();
  const read =
    typeof row.read === 'boolean'
      ? row.read
      : statusValue === 'read' || statusValue === 'acknowledged';

  const notification: AdminNotification = {
    id,
    timestamp: createdAt,
    type: mapNotificationType(row.type, row.status),
    title: getString(row.title, 'Notification'),
    message: getString(row.message),
    read,
    created_at: createdAt,
  };

  if (actionUrl) {
    notification.action = { url: actionUrl, label: actionLabel };
  }

  if (metadata) {
    notification.metadata = metadata;
  }

  return notification;
};

const normalizeActivityItem = (row: AdminActivityRow): ActivityItem => {
  const details = isRecord(row.details) ? row.details : {};
  const metadata = isRecord(row.details) ? (row.details as Record<string, unknown>) : undefined;

  const descriptionSource =
    typeof row.details === 'string'
      ? row.details
      : getString(details.description ?? details.message, '');

  const activity: ActivityItem = {
    id: row.id,
    type: getString(details.type ?? row.action, 'activity'),
    title: getString(details.title ?? row.action, 'Admin Activity'),
    description: descriptionSource,
    timestamp: row.timestamp ?? row.created_at ?? new Date().toISOString(),
  };

  const userId = getOptionalString(details.userId ?? details.user_id ?? row.admin_id);
  if (userId) {
    activity.user_id = userId;
  }

  if (metadata) {
    activity.metadata = metadata;
  }

  return activity;
};

const parseSystemMetrics = (value: unknown): SystemMetrics | null => {
  if (!isRecord(value)) {
    return null;
  }

  const totalTopics = getNumber(value.total_topics, 0);
  const totalPolls = getNumber(value.total_polls, 0);
  const activePolls = getNumber(value.active_polls, 0);
  const systemHealth = getString(value.system_health, 'unknown') || 'unknown';
  const lastUpdated =
    getOptionalString(value.last_updated) ?? new Date().toISOString();

  const metrics: SystemMetrics = {
    total_topics: totalTopics,
    total_polls: totalPolls,
    active_polls: activePolls,
    system_health: systemHealth,
    last_updated: lastUpdated,
  };

  const totalUsers = getOptionalNumber(value.total_users);
  if (typeof totalUsers === 'number') {
    metrics.total_users = totalUsers;
  }

  const totalVotes = getOptionalNumber(value.total_votes);
  if (typeof totalVotes === 'number') {
    metrics.total_votes = totalVotes;
  }

  const activeSessions = getOptionalNumber(value.active_sessions);
  if (typeof activeSessions === 'number') {
    metrics.active_sessions = activeSessions;
  }

  const systemUptime = getOptionalNumber(value.system_uptime);
  if (typeof systemUptime === 'number') {
    metrics.system_uptime = systemUptime;
  }

  const memoryUsage = getOptionalNumber(value.memory_usage);
  if (typeof memoryUsage === 'number') {
    metrics.memory_usage = memoryUsage;
  }

  const cpuUsage = getOptionalNumber(value.cpu_usage);
  if (typeof cpuUsage === 'number') {
    metrics.cpu_usage = cpuUsage;
  }

  const diskUsage = getOptionalNumber(value.disk_usage);
  if (typeof diskUsage === 'number') {
    metrics.disk_usage = diskUsage;
  }

  const performanceMetrics = value.performance_metrics;
  if (isRecord(performanceMetrics)) {
    const responseTime = getOptionalNumber(performanceMetrics.response_time_avg);
    const errorRate = getOptionalNumber(performanceMetrics.error_rate);
    const throughput = getOptionalNumber(performanceMetrics.throughput);

    if (
      typeof responseTime === 'number' &&
      typeof errorRate === 'number' &&
      typeof throughput === 'number'
    ) {
      metrics.performance_metrics = {
        response_time_avg: responseTime,
        error_rate: errorRate,
        throughput,
      };
    }
  }

  return metrics;
};

const fetchSystemMetrics = async (signal?: AbortSignal): Promise<SystemMetrics | null> => {
  if (!isBrowser()) {
    return null;
  }
  try {
    const response = await fetch('/api/admin/system-metrics', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      signal: signal ?? null,
    });

    if (!response.ok) {
      logger.warn('Failed to fetch system metrics', { status: response.status });
      return null;
    }

    const payload = await response.json().catch(() => null);
    const metrics =
      payload?.data?.metrics ??
      payload?.data ??
      payload?.metrics ??
      null;

    return parseSystemMetrics(metrics);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }
    logger.error('Error fetching system metrics', error instanceof Error ? error : undefined);
    return null;
  }
};

const requestSystemMetrics = (callback: AdminRealtimeSubscriptionCallback) => {
  if (!isBrowser()) {
    return;
  }

  if (activeMetricsController) {
    activeMetricsController.abort();
  }

  const controller = new AbortController();
  activeMetricsController = controller;

  void fetchSystemMetrics(controller.signal)
    .then((metrics) => {
      if (metrics) {
        callback({ type: 'system-metrics', payload: metrics });
      }
    })
    .finally(() => {
      if (activeMetricsController?.signal === controller.signal) {
        activeMetricsController = null;
      }
    });
};

const handleAdminNotificationEvent = (
  payload: RealtimePostgresChangesPayload<AdminNotificationRow>,
  callback: AdminRealtimeSubscriptionCallback
) => {
  const notification = normalizeAdminNotification(payload.new);
  if (notification) {
    callback({ type: 'notification', payload: notification });
  }
};

const handleAdminActivityEvent = (
  payload: RealtimePostgresChangesPayload<AdminActivityRow>,
  callback: AdminRealtimeSubscriptionCallback
) => {
  if (payload.eventType !== 'INSERT' || !payload.new) {
    return;
  }
  callback({
    type: 'activity',
    payload: normalizeActivityItem(payload.new),
  });
};

const setupAdminSubscription = async (
  subscriptionId: string,
  callback: AdminRealtimeSubscriptionCallback
) => {
  try {
    const supabase = await ensureSupabaseClient();
    const channel = supabase.channel(`${ADMIN_CHANNEL_PREFIX}:${subscriptionId}`, {
      config: {
        broadcast: { ack: true },
      },
    });

    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'system_health',
    }, () => requestSystemMetrics(callback));

    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'trending_topics',
    }, () => requestSystemMetrics(callback));

    channel.on<AdminNotificationRow>('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'admin_notifications',
    }, (payload) => handleAdminNotificationEvent(payload, callback));

    channel.on<AdminActivityRow>('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'admin_activity_log',
    }, (payload) => handleAdminActivityEvent(payload, callback));

    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'feedback',
    }, () => requestSystemMetrics(callback));

    await channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        requestSystemMetrics(callback);
        logger.info('Admin realtime subscription established', { subscriptionId });
      } else if (status === 'CHANNEL_ERROR') {
        logger.error('Admin realtime channel error', undefined, { subscriptionId });
      }
    });

    subscriptions.set(subscriptionId, channel);
  } catch (error) {
    logger.error(
      'Failed to initialize admin realtime subscription',
      error instanceof Error ? error : undefined,
      { subscriptionId }
    );
    requestSystemMetrics(callback);
  }
};

const setupFeedbackSubscription = async (
  subscriptionId: string,
  callback: FeedbackRealtimeSubscriptionCallback
) => {
  try {
    const supabase = await ensureSupabaseClient();
    const channel = supabase.channel(`${FEEDBACK_CHANNEL_PREFIX}:${subscriptionId}`, {
      config: {
        broadcast: { ack: true },
      },
    });

    channel.on<FeedbackRow>('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'feedback',
    }, (payload) => {
      if (payload.new) {
        callback({
          type: 'feedback-received',
          payload: normalizeFeedbackContext(payload.new),
        });
      }
    });

    channel.on<FeedbackRow>('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'feedback',
    }, (payload) => {
      if (payload.new) {
        callback({
          type: 'feedback-updated',
          payload: normalizeFeedbackContext(payload.new),
        });
      }
    });

    await channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        logger.error('Feedback realtime channel error', undefined, { subscriptionId });
      }
    });

    subscriptions.set(subscriptionId, channel);
    logger.info('Feedback realtime subscription established', { subscriptionId });
  } catch (error) {
    logger.error(
      'Failed to initialize feedback realtime subscription',
      error instanceof Error ? error : undefined,
      { subscriptionId }
    );
  }
};

export const realTimeService = {
  subscribeToAdminUpdates(callback: AdminRealtimeSubscriptionCallback): string {
    const subscriptionId = createSubscriptionId(ADMIN_CHANNEL_PREFIX);

    if (!isBrowser()) {
      logger.warn('Attempted to subscribe to admin realtime updates outside the browser', {
        subscriptionId,
      });
      return subscriptionId;
    }

    void setupAdminSubscription(subscriptionId, callback);
    return subscriptionId;
  },

  subscribeToFeedbackUpdates(callback: FeedbackRealtimeSubscriptionCallback): string {
    const subscriptionId = createSubscriptionId(FEEDBACK_CHANNEL_PREFIX);

    if (!isBrowser()) {
      logger.warn('Attempted to subscribe to feedback realtime updates outside the browser', {
        subscriptionId,
      });
      return subscriptionId;
    }

    void setupFeedbackSubscription(subscriptionId, callback);
    return subscriptionId;
  },

  unsubscribe(subscriptionId: string): void {
    const channel = subscriptions.get(subscriptionId);
    if (!channel) {
      return;
    }

    subscriptions.delete(subscriptionId);
    void channel.unsubscribe();
    logger.info('Realtime subscription closed', { subscriptionId });
  },
};

