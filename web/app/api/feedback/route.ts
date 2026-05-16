import { z } from 'zod';

import {
  validateCsrfProtection,
  createCsrfErrorResponse,
} from '@/app/api/auth/_shared';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import {
  withErrorHandling,
  successResponse,
  validationError,
  errorResponse,
  rateLimitError,
  parseBody,
} from '@/lib/api';
import { FEEDBACK_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { sanitizeInput } from '@/lib/core/auth/server-actions';
import { validateFeedbackContent } from '@/lib/feedback/content-validation';
import { normalizeFeedbackScreenshot } from '@/lib/feedback/normalize-screenshot';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { stripUndefinedDeep } from '@/lib/util/clean';
import { devLog, logger } from '@/lib/utils/logger';

import type { Json } from '@/types/supabase';
import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

// Validation schema for feedback request
const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'performance', 'accessibility', 'security', 'correction', 'csp-violation']),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be at most 1000 characters'),
  sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']),
  screenshot: z.string().max(750_000).optional().nullable(),
  userJourney: z.record(z.string(), z.unknown()).optional().nullable(),
  feedbackContext: z.object({
    aiAnalysis: z.record(z.string(), z.unknown()).nullish(),
  }).passthrough().optional().nullable(),
  'csp-report': z.record(z.string(), z.unknown()).optional(),
});

type FeedbackRequestBody = z.infer<typeof feedbackSchema>;

// Security configuration for feedback API
// NOTE: Content rules (spam wording, length) live in `lib/feedback/content-validation.ts`
// so they can be unit-tested and shared. Keep this object focused on transport bounds.
const securityConfig = {
  maxRequestSize: 1024 * 1024, // 1MB
};

function stringifySupabaseError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const o = error as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (typeof o.details === 'string') return o.details;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error ?? 'Unknown error');
}

// Request size validation
function validateRequestSize(request: NextRequest): { valid: boolean; reason?: string } {
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > securityConfig.maxRequestSize) {
    return { valid: false, reason: 'Request too large' }
  }
  return { valid: true }
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!(await validateCsrfProtection(request))) {
    return createCsrfErrorResponse();
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';
  const ua = request.headers.get('user-agent');
  const rateLimitOptions: { maxRequests: number; windowMs: number; userAgent?: string } = {
    maxRequests: 10,
    windowMs: 60 * 1000,
  };
  if (ua) rateLimitOptions.userAgent = ua;
  const rateLimitResult = await apiRateLimiter.checkLimit(ip, '/api/feedback', rateLimitOptions);
  if (!rateLimitResult.allowed) {
    return errorResponse('Too many requests. Please try again later.', 429);
  }

  const sizeValidation = validateRequestSize(request);
  if (!sizeValidation.valid) {
    return errorResponse(
      sizeValidation.reason ?? 'Request too large',
      413,
      undefined,
      'PAYLOAD_TOO_LARGE'
    );
  }

  const parsedBody = await parseBody<FeedbackRequestBody>(request);
  if (!parsedBody.success) {
    return parsedBody.error;
  }

  // Validate with Zod schema
  const validationResult = feedbackSchema.safeParse(parsedBody.data);
  if (!validationResult.success) {
    const fieldErrors: Record<string, string> = {};
    validationResult.error.issues.forEach((issue) => {
      const field = issue.path.join('.') || 'body';
      fieldErrors[field] = issue.message;
    });
    return validationError(fieldErrors, 'Invalid feedback data');
  }

  const {
    type,
    title,
    description,
    sentiment,
    screenshot,
    userJourney,
    feedbackContext,
  } = validationResult.data;

  // Additional content validation (spam detection, length).
  // Intentionally permissive: URLs, acronyms, and emphatic punctuation are
  // common and useful in real bug reports — previous rules silently dropped
  // legitimate feedback. See lib/feedback/content-validation.ts for the
  // rationale and tests.
  const titleValidation = validateFeedbackContent(title, 'title');
  if (!titleValidation.valid) {
    return validationError({ title: titleValidation.reason ?? 'Invalid title' });
  }

  const descriptionValidation = validateFeedbackContent(description, 'description');
  if (!descriptionValidation.valid) {
    return validationError({
      description: descriptionValidation.reason ?? 'Invalid description',
    });
  }

  const supabaseClient = await getSupabaseServerClient();
  if (!supabaseClient) {
    devLog('Supabase not configured - using mock response');
    return successResponse(
      buildFeedbackResponse(`mock-${Date.now()}`, userJourney),
      { source: 'mock', mode: 'degraded' }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError) {
    devLog('Could not get user, proceeding with anonymous feedback:', {
      error: userError.message,
    });
  }

  if (user?.id) {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabaseClient
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', String(user.id))
      .gte('created_at', today);

    if (typeof count === 'number' && count >= 10) {
      return rateLimitError('Daily feedback limit exceeded (10 per day)', 86400);
    }
  }

  if (type === 'csp-violation') {
    const cspData = {
      user_id: null,
      feedback_type: 'csp-violation',
      title: 'CSP Violation Report',
      description: `CSP Violation: ${sanitizeInput(description)}`,
      sentiment: 'negative',
      screenshot: null,
      user_journey: {},
      status: 'open',
      priority: 'urgent',
      tags: ['security', 'csp', 'violation'],
      ai_analysis: {},
      metadata: {
        cspReport: parsedBody.data['csp-report'] ?? {},
        userAgent: request.headers.get('user-agent') ?? 'unknown',
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown',
        timestamp: new Date().toISOString(),
        security: {
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown',
          userAgent: request.headers.get('user-agent') ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      },
    };

    devLog('Processing CSP violation report:', cspData);

    const { data: cspResult, error: cspError } = await supabaseClient
      .from('feedback')
      .insert(stripUndefinedDeep(cspData) as any)
      .select(FEEDBACK_SELECT_COLUMNS)
      .single();

    if (cspError) {
      logger.error('Error storing CSP violation:', cspError);
      return errorResponse('Failed to store CSP violation report');
    }

    logger.warn('CSP Violation Report', {
      'csp-report': parsedBody.data['csp-report'],
      feedbackId: cspResult.id,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown',
    });

    return successResponse(
      buildFeedbackResponse(
        cspResult.id,
        undefined,
        'CSP violation report received'
      ),
      { action: 'csp-violation' }
    );
  }

  const metadataPayload = {
    feedbackContext: (feedbackContext ?? {}) as Json,
    userAgent: userJourney?.userAgent ?? null,
    deviceInfo: userJourney?.deviceInfo ?? null,
    performanceMetrics: userJourney?.performanceMetrics ?? null,
    errors: (userJourney?.errors ?? []) as Json,
    sessionInfo: {
      sessionId: userJourney?.sessionId ?? null,
      sessionStartTime: userJourney?.sessionStartTime ?? null,
      totalPageViews: userJourney?.totalPageViews ?? null,
    },
    security: {
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      timestamp: new Date().toISOString(),
    },
  } as Json;

  const priority =
    type === 'security'
      ? 'urgent'
      : type === 'bug' || type === 'correction'
        ? 'high'
        : 'medium';

  const normalizedScreenshot = normalizeFeedbackScreenshot(screenshot);

  const feedbackData = {
    user_id: user?.id ?? null,
    feedback_type: type,
    title: sanitizeInput(title.trim()),
    description: sanitizeInput(description.trim()),
    sentiment,
    screenshot: normalizedScreenshot,
    user_journey: (userJourney ?? {}) as Json,
    status: 'open',
    priority,
    tags: generateTags(type, title, description, sentiment),
    ai_analysis: (feedbackContext?.aiAnalysis ?? {}) as Json,
    metadata: metadataPayload,
  };

  devLog('Inserting enhanced feedback data:', {
    user_id: feedbackData.user_id ? 'authenticated' : 'anonymous',
    type: feedbackData.feedback_type,
    sentiment: feedbackData.sentiment,
    sessionId: (userJourney as Record<string, unknown>)?.sessionId,
    currentPage: (userJourney as Record<string, unknown>)?.currentPage,
    deviceType: (userJourney as Record<string, unknown>)?.deviceInfo && typeof (userJourney as Record<string, unknown>).deviceInfo === 'object' && (userJourney as Record<string, unknown>).deviceInfo !== null
      ? ((userJourney as Record<string, unknown>).deviceInfo as Record<string, unknown>)?.type
      : undefined,
  });

  const persistResult = await persistFeedbackRow(feedbackData);
  if (!persistResult.ok) {
    logger.error('Feedback insert failed', { error: persistResult.error });
    return errorResponse('Failed to save feedback', 500, 'Feedback persistence failed');
  }

  const insertedRecord = persistResult.id;

  const journey = userJourney as Record<string, unknown> | null | undefined;
  const deviceInfo = journey?.deviceInfo && typeof journey.deviceInfo === 'object' && journey.deviceInfo !== null
    ? (journey.deviceInfo as Record<string, unknown>)
    : null;
  const errors = Array.isArray(journey?.errors) ? journey.errors : [];
  
  devLog('Enhanced feedback submitted:', {
    type,
    sentiment,
    page: journey?.currentPage,
    device: deviceInfo?.type,
    browser: deviceInfo?.browser,
    os: deviceInfo?.os,
    sessionId: journey?.sessionId,
    timestamp: new Date().toISOString(),
    user_id: user?.id ? 'authenticated' : 'anonymous',
    performance: {
      pageLoadTime: journey?.pageLoadTime,
      timeOnPage: journey?.timeOnPage,
    },
    errors: errors.length,
  });

  return successResponse(buildFeedbackResponse(insertedRecord, userJourney));
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const type = searchParams.get('type') ?? undefined;
  const sentiment = searchParams.get('sentiment') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? '50');
  const offset = Number(searchParams.get('offset') ?? '0');

  if (Number.isNaN(limit) || limit <= 0 || limit > 200) {
    return validationError({ limit: 'Limit must be between 1 and 200' });
  }

  if (Number.isNaN(offset) || offset < 0) {
    return validationError({ offset: 'Offset must be zero or greater' });
  }

  const supabaseClient = await getSupabaseServerClient();
  if (!supabaseClient) {
    devLog('Supabase not configured - using mock response');
    return successResponse(
      {
        feedback: [],
        count: 0,
        analytics: generateAnalytics([]),
      },
      { source: 'mock', mode: 'degraded' }
    );
  }

  let query = supabaseClient
    .from('feedback')
    .select(
      'id, user_id, feedback_type, title, description, sentiment, status, created_at, updated_at, user_journey, metadata, ai_analysis, tags'
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (type) {
    query = query.eq('feedback_type', type);
  }

  if (sentiment) {
    query = query.eq('sentiment', sentiment);
  }

  const { data, error } = await query;

  if (error) {
    devLog('Database error:', { error });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (
      errorMessage.includes('relation "feedback" does not exist') ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('schema cache')
    ) {
      devLog('Schema cache issue or table not ready - using mock response');
      return successResponse(
        {
          feedback: [],
          count: 0,
          analytics: generateAnalytics([]),
        },
        { source: 'mock', fallback: 'schema-cache' }
      );
    }

    return errorResponse('Failed to fetch feedback', 500, errorMessage);
  }

  const processedFeedback =
    data && !('error' in data)
      ? data.map((item: any) => {
          const journey = item.user_journey ?? {};
          return {
            id: item.id,
            userId: item.user_id,
            type: item.feedback_type ?? item.type,
            content: item.description ?? item.title ?? '',
            status: item.status ?? 'open',
            sentiment: item.sentiment,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            userJourney: journey,
            metadata: item.metadata,
            aiAnalysis: item.ai_analysis,
            tags: item.tags ?? [],
            deviceType: journey?.deviceInfo?.type,
            browser: journey?.deviceInfo?.browser,
            os: journey?.deviceInfo?.os,
            pageLoadTime: journey?.pageLoadTime,
            timeOnPage: journey?.timeOnPage,
            errorCount: journey?.errors?.length ?? 0,
            sessionId: journey?.sessionId,
          };
        })
      : [];

  return successResponse({
    feedback: processedFeedback,
    count: processedFeedback.length,
    analytics: generateAnalytics(processedFeedback),
  });
});

type FeedbackInsertRow = {
  user_id: string | null;
  feedback_type: string;
  title: string;
  description: string;
  sentiment: string;
  screenshot: string | null;
  user_journey: Json;
  status: string;
  priority: string;
  tags: string[];
  ai_analysis: Json;
  metadata: Json;
};

async function persistFeedbackRow(
  feedbackData: FeedbackInsertRow,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const payload = stripUndefinedDeep(feedbackData);

  const tryInsert = async (
    label: 'admin' | 'session',
    client: Awaited<ReturnType<typeof getSupabaseAdminClient>>,
  ) => {
    const { data, error } = await client
      .from('feedback')
      .insert(payload)
      .select(FEEDBACK_SELECT_COLUMNS)
      .single();
    if (error) {
      return { ok: false as const, error: stringifySupabaseError(error), label };
    }
    if (data && 'id' in data && typeof (data as { id: string }).id === 'string') {
      return { ok: true as const, id: (data as { id: string }).id, label };
    }
    return { ok: false as const, error: 'Insert returned no id', label };
  };

  try {
    const adminClient = await getSupabaseAdminClient();
    const adminResult = await tryInsert('admin', adminClient);
    if (adminResult.ok) {
      devLog('Feedback stored', { feedbackId: adminResult.id, client: 'admin' });
      return { ok: true, id: adminResult.id };
    }
    logger.warn('Admin feedback insert failed; retrying with session client', {
      error: adminResult.error,
    });
  } catch (adminClientError) {
    logger.warn('Admin client unavailable for feedback insert; retrying with session client', {
      error:
        adminClientError instanceof Error
          ? adminClientError.message
          : String(adminClientError),
    });
  }

  const sessionClient = await getSupabaseServerClient();
  if (!sessionClient) {
    return { ok: false, error: 'Database not configured' };
  }

  const sessionResult = await tryInsert('session', sessionClient);
  if (sessionResult.ok) {
    devLog('Feedback stored', { feedbackId: sessionResult.id, client: 'session' });
    return { ok: true, id: sessionResult.id };
  }

  return { ok: false, error: sessionResult.error };
}

function buildFeedbackResponse(
  feedbackId: string | null,
  userJourney?: Record<string, any> | null,
  message: string = 'Enhanced feedback submitted successfully'
) {
  return {
    message,
    feedbackId,
    context: {
      sessionId: userJourney?.sessionId,
      deviceInfo: userJourney?.deviceInfo,
      performanceMetrics: userJourney?.performanceMetrics,
    },
  };
}

// Helper functions
function generateTags(type: string, title: string, description: string, sentiment: string): string[] {
  const tags: string[] = []
  
  // Type-based tags
  tags.push(type)
  
  // Sentiment-based tags
  tags.push(`${sentiment}-feedback`)
  
  // Content-based tags
  const content = `${title} ${description}`.toLowerCase()
  
  if (content.includes('bug') || content.includes('error') || content.includes('broken')) {
    tags.push('bug-report')
  }
  
  if (content.includes('feature') || content.includes('request') || content.includes('add')) {
    tags.push('feature-request')
  }
  
  if (content.includes('slow') || content.includes('performance') || content.includes('lag')) {
    tags.push('performance-issue')
  }
  
  if (content.includes('mobile') || content.includes('responsive') || content.includes('screen')) {
    tags.push('responsive-design')
  }
  
  if (content.includes('privacy') || content.includes('security') || content.includes('data')) {
    tags.push('privacy-security')
  }
  
  if (content.includes('accessibility') || content.includes('a11y') || content.includes('screen-reader')) {
    tags.push('accessibility')
  }
  
  return tags
}

function generateAnalytics(feedback: any[]): any {
  const analytics = {
    total: feedback.length,
    byType: {},
    bySentiment: {},
    byDevice: {},
    byBrowser: {},
    byOS: {},
    performance: {
      avgPageLoadTime: 0,
      avgTimeOnPage: 0,
      totalErrors: 0
    },
    topPages: {},
    topIssues: {}
  }
  
  const typeCount: any = {}
  const sentimentCount: any = {}
  const deviceCount: any = {}
  const browserCount: any = {}
  const osCount: any = {}
  const pageCount: any = {}
  const issueCount: any = {}
  
  let totalPageLoadTime = 0
  let totalTimeOnPage = 0
  let totalErrors = 0
  let validPageLoadTimes = 0
  let validTimeOnPage = 0
  
  feedback.forEach(item => {
    // Count by type
    typeCount[item.type] = (typeCount[item.type] || 0) + 1
    
    // Count by sentiment
    sentimentCount[item.sentiment] = (sentimentCount[item.sentiment] || 0) + 1
    
    // Count by device
    if (item.deviceType) {
      deviceCount[item.deviceType] = (deviceCount[item.deviceType] || 0) + 1
    }
    
    // Count by browser
    if (item.browser) {
      browserCount[item.browser] = (browserCount[item.browser] || 0) + 1
    }
    
    // Count by OS
    if (item.os) {
      osCount[item.os] = (osCount[item.os] || 0) + 1
    }
    
    // Count by page
    if (item.userJourney?.currentPage) {
      pageCount[item.userJourney.currentPage] = (pageCount[item.userJourney.currentPage] || 0) + 1
    }
    
    // Count by issue (using tags)
    if (item.tags) {
      item.tags.forEach((tag: string) => {
        issueCount[tag] = (issueCount[tag] || 0) + 1
      })
    }
    
    // Performance metrics
    if (item.pageLoadTime && item.pageLoadTime > 0) {
      totalPageLoadTime += item.pageLoadTime
      validPageLoadTimes++
    }
    
    if (item.timeOnPage && item.timeOnPage > 0) {
      totalTimeOnPage += item.timeOnPage
      validTimeOnPage++
    }
    
    totalErrors += item.errorCount ?? 0
  })
  
  analytics.byType = typeCount
  analytics.bySentiment = sentimentCount
  analytics.byDevice = deviceCount
  analytics.byBrowser = browserCount
  analytics.byOS = osCount
  analytics.topPages = pageCount
  analytics.topIssues = issueCount
  
  analytics.performance.avgPageLoadTime = validPageLoadTimes > 0 ? totalPageLoadTime / validPageLoadTimes : 0
  analytics.performance.avgTimeOnPage = validTimeOnPage > 0 ? totalTimeOnPage / validTimeOnPage : 0
  analytics.performance.totalErrors = totalErrors
  
  return analytics
}
