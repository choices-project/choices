import type { NextRequest } from 'next/server';

import {
  withErrorHandling,
  successResponse,
  validationError,
  errorResponse,
  rateLimitError,
} from '@/lib/api';
import { anonymizeIP, getSecurityConfig } from '@/lib/core/security/config';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import logger from '@/lib/utils/logger';
import type { Json, TablesInsert } from '@/types/supabase';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const SECURITY_CONFIG = getSecurityConfig();
const ENDPOINT_KEY = 'analytics:performance-metrics';
const MAX_DOCUMENT_LENGTH = 250_000; // ~250 KB
const MAX_METRICS_SAVED = 150;
const MAX_BUNDLES = 20;
const MAX_RESOURCES = 25;
const SYNC_RATE_LIMIT = {
  maxRequests: 8,
  windowMs: 5 * 60 * 1000, // 5 minutes
};

type RawMetric = {
  name?: string;
  value?: number;
  unit?: string;
  type?: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
};

type PerformancePayload = {
  document?: string;
  metrics?: RawMetric[];
  page?: string;
  sessionId?: string;
  meta?: Record<string, unknown>;
};

type NormalizedMetric = {
  name: string;
  value: number;
  unit?: string;
  type?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

const sanitizeMetricMetadata = (metadata: unknown): Record<string, unknown> | undefined => {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  const entries = Object.entries(metadata).slice(0, 5);
  return entries.reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (typeof key === 'string' && key.length <= 32) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

const normalizeMetrics = (raw: unknown): NormalizedMetric[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  const metrics: NormalizedMetric[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const { name, value, unit, type, timestamp, metadata } = item as RawMetric;
    if (typeof name !== 'string' || !name.trim()) {
      continue;
    }

    const numericValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number.parseFloat(value)
          : Number.NaN;

    if (!Number.isFinite(numericValue)) {
      continue;
    }

    const metric: NormalizedMetric = {
      name: name.slice(0, 64),
      value: numericValue,
      timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
    };

    if (typeof unit === 'string') {
      metric.unit = unit.slice(0, 16);
    }
    if (typeof type === 'string') {
      metric.type = type.slice(0, 32);
    }

    const sanitizedMetadata = sanitizeMetricMetadata(metadata);
    if (sanitizedMetadata) {
      metric.metadata = sanitizedMetadata;
    }

    metrics.push(metric);
    if (metrics.length >= MAX_METRICS_SAVED) {
      break;
    }
  }

  return metrics;
};

const sanitizeSummary = (summary: unknown, metricsCount: number) => {
  if (!summary || typeof summary !== 'object') {
    return {
      metricsCount,
    };
  }

  const summaryRecord = summary as Record<string, unknown>;
  const result: Record<string, unknown> = {
    metricsCount,
  };

  if (typeof summaryRecord.totalMetrics === 'number') {
    result.totalMetrics = summaryRecord.totalMetrics;
  }
  if (typeof summaryRecord.averageLoadTime === 'number') {
    result.averageLoadTime = summaryRecord.averageLoadTime;
  }
  if (typeof summaryRecord.performanceScore === 'number' || typeof summaryRecord.score === 'number') {
    result.performanceScore =
      typeof summaryRecord.performanceScore === 'number'
        ? summaryRecord.performanceScore
        : summaryRecord.score;
  }
  if (typeof summaryRecord.grade === 'string') {
    result.grade = summaryRecord.grade;
  }

  return result;
};

const sanitizeWebVitals = (vitals: unknown) => {
  if (!vitals || typeof vitals !== 'object') {
    return null;
  }

  const allowedKeys = ['lcp', 'fid', 'cls', 'fcp', 'ttfb'];
  const result: Record<string, number> = {};

  for (const key of allowedKeys) {
    const value = (vitals as Record<string, unknown>)[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
};

type BundleSample = {
  bundleName?: string;
  loadTime?: number;
  parseTime?: number;
  executeTime?: number;
  size?: number;
  gzipSize?: number;
};

const sanitizeBundles = (bundles: unknown): BundleSample[] => {
  if (!Array.isArray(bundles)) {
    return [];
  }

  const sanitized: BundleSample[] = [];
  for (const bundle of bundles) {
    if (!bundle || typeof bundle !== 'object') {
      continue;
    }

    const record = bundle as Record<string, unknown>;
    const sample: BundleSample = {};

    if (typeof record.bundleName === 'string') {
      sample.bundleName = record.bundleName.slice(0, 128);
    }
    if (typeof record.loadTime === 'number') {
      sample.loadTime = record.loadTime;
    }
    if (typeof record.parseTime === 'number') {
      sample.parseTime = record.parseTime;
    }
    if (typeof record.executeTime === 'number') {
      sample.executeTime = record.executeTime;
    }
    if (typeof record.size === 'number') {
      sample.size = record.size;
    }
    if (typeof record.gzipSize === 'number') {
      sample.gzipSize = record.gzipSize;
    }

    if (Object.keys(sample).length > 0) {
      sanitized.push(sample);
    }

    if (sanitized.length >= MAX_BUNDLES) {
      break;
    }
  }

  return sanitized;
};

type ResourceSample = {
  url?: string;
  type?: string;
  loadTime?: number;
  size?: number;
  cached?: boolean;
};

const sanitizeResources = (resources: unknown): ResourceSample[] => {
  if (!Array.isArray(resources)) {
    return [];
  }

  const sanitized: ResourceSample[] = [];
  for (const resource of resources) {
    if (!resource || typeof resource !== 'object') {
      continue;
    }

    const record = resource as Record<string, unknown>;
    const sample: ResourceSample = {};

    if (typeof record.url === 'string') {
      sample.url = record.url.slice(0, 256);
    }
    if (typeof record.type === 'string') {
      sample.type = record.type.slice(0, 32);
    }
    if (typeof record.loadTime === 'number') {
      sample.loadTime = record.loadTime;
    }
    if (typeof record.size === 'number') {
      sample.size = record.size;
    }
    if (typeof record.cached === 'boolean') {
      sample.cached = record.cached;
    }

    if (Object.keys(sample).length > 0) {
      sanitized.push(sample);
    }

    if (sanitized.length >= MAX_RESOURCES) {
      break;
    }
  }

  return sanitized;
};

const getClientIp = (request: NextRequest): string => {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const forwarded = xForwardedFor.split(',').map((ip) => ip.trim()).filter(Boolean);
    if (forwarded.length > 0 && forwarded[0]) {
      return forwarded[0];
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
};

const parseDocument = (document: unknown) => {
  if (typeof document !== 'string') {
    return null;
  }

  if (document.length > MAX_DOCUMENT_LENGTH) {
    throw new Error('document_too_large');
  }

  try {
    return JSON.parse(document) as Record<string, unknown>;
  } catch {
    throw new Error('invalid_document');
  }
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  const ipAddress = getClientIp(request);
  const userAgent = request.headers.get('user-agent');
  const rateLimitResult = await apiRateLimiter.checkLimit(ipAddress, ENDPOINT_KEY, {
    ...SYNC_RATE_LIMIT,
    ...(userAgent ? { userAgent } : {}),
  });

  if (!rateLimitResult.allowed) {
    return rateLimitError(
      'Too many performance reports from this client. Please wait before retrying.',
      rateLimitResult.retryAfter ?? Math.ceil(SYNC_RATE_LIMIT.windowMs / 1000),
    );
  }

  const payload = (await request.json().catch(() => null)) as PerformancePayload | null;
  if (!payload) {
    return validationError({ body: 'Invalid JSON payload' });
  }

  if (typeof payload.document !== 'string' && !Array.isArray(payload.metrics)) {
    return validationError({
      document: 'Provide either a serialized performance document or an array of metrics',
    });
  }

  let parsedDocument: Record<string, unknown> | null = null;
  if (payload.document) {
    try {
      parsedDocument = parseDocument(payload.document);
    } catch (error) {
      if (error instanceof Error && error.message === 'document_too_large') {
        return validationError({
          document: `Document is too large (max ${MAX_DOCUMENT_LENGTH} characters)`,
        });
      }
      return validationError({
        document: 'Document must be valid JSON serialized via performanceMetrics.exportMetrics()',
      });
    }
  }

  const metricSource =
    Array.isArray(payload.metrics) ? payload.metrics : parsedDocument?.metrics ?? [];
  const normalizedMetrics = normalizeMetrics(metricSource);
  const metricsCount =
    (Array.isArray(metricSource) ? metricSource.length : 0) ||
    (typeof parsedDocument?.summary === 'object' &&
    parsedDocument.summary &&
    typeof (parsedDocument.summary as Record<string, unknown>).totalMetrics === 'number'
      ? ((parsedDocument.summary as Record<string, unknown>).totalMetrics as number)
      : normalizedMetrics.length);

  if (normalizedMetrics.length === 0) {
    return validationError({
      metrics: 'No valid metrics were provided',
    });
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection failed', 503);
  }

  let userId: string | null = null;
  try {
    const { data: authData } = await supabase.auth.getUser();
    userId = authData?.user?.id ?? null;
    // Session is not available from getUser(), we'll use the sessionId from payload
  } catch (error) {
    logger.warn('Performance metrics ingestion: unable to fetch user session', error);
  }

  const sanitizedSummary = sanitizeSummary(parsedDocument?.summary, metricsCount);
  const sanitizedVitals =
    sanitizeWebVitals(parsedDocument?.coreWebVitals ?? parsedDocument?.core_web_vitals) ?? undefined;
  const sanitizedBundles = sanitizeBundles(
    parsedDocument?.bundlePerformance ?? parsedDocument?.bundle_performance,
  );
  const sanitizedResources = sanitizeResources(
    parsedDocument?.resourcePerformance ?? parsedDocument?.resource_performance,
  );

  const eventData = {
    summary: sanitizedSummary,
    core_web_vitals: sanitizedVitals,
    bundle_performance: sanitizedBundles,
    resource_performance: sanitizedResources,
    metrics_sample: normalizedMetrics,
    metrics_count: metricsCount,
    page: typeof payload.page === 'string'
      ? payload.page
      : (parsedDocument?.summary as { url?: string } | undefined)?.url ?? null,
    meta: {
      ...payload.meta,
      client_timestamp: Date.now(),
      buffered_metrics: normalizedMetrics.length,
    },
  };

  const anonymizedIp = SECURITY_CONFIG.privacy.anonymizeIPs ? anonymizeIP(ipAddress) : ipAddress;
  const requestSessionId =
    typeof payload.sessionId === 'string' ? payload.sessionId : null;

  const insertPayload: TablesInsert<'analytics_events'> = {
    event_type: 'performance_metric',
    event_data: eventData as Json,
    created_at: new Date().toISOString(),
    user_agent: request.headers.get('user-agent'),
    referrer: request.headers.get('referer'),
    session_id: requestSessionId,
    user_id: userId,
    ip_address: anonymizedIp,
  };

  const { error } = await supabase.from('analytics_events').insert(insertPayload);
  if (error) {
    logger.error('Failed to persist performance metrics', error);
    return errorResponse('Unable to record performance metrics', 500);
  }

  return successResponse({
    recorded: true,
    metricsStored: normalizedMetrics.length,
    totalMetrics: metricsCount,
    rateLimit: {
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime,
    },
  });
});

