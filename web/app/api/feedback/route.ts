import type { NextRequest } from 'next/server';

import {
  withErrorHandling,
  successResponse,
  validationError,
  errorResponse,
  rateLimitError,
  parseBody,
} from '@/lib/api';
import { stripUndefinedDeep } from '@/lib/util/clean';
import { devLog, logger } from '@/lib/utils/logger';
import type { Json } from '@/types/supabase';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const FEEDBACK_TYPES = [
  'bug',
  'feature',
  'general',
  'performance',
  'accessibility',
  'security',
  'correction',
  'csp-violation',
] as const;

const SENTIMENT_VALUES = ['positive', 'negative', 'neutral', 'mixed'] as const;

type FeedbackRequestBody = {
  type: string;
  title: string;
  description: string;
  sentiment: string;
  screenshot?: string | null;
  userJourney?: Record<string, any> | null;
  feedbackContext?: {
    aiAnalysis?: Record<string, any>;
    [key: string]: unknown;
  } | null;
  ['csp-report']?: Record<string, any>;
};

// Security configuration for feedback API
const securityConfig = {
  maxContentLength: 1000,
  maxTitleLength: 200,
  maxRequestSize: 1024 * 1024, // 1MB
  suspiciousPatterns: [
    /[A-Z]{5,}/,                                    // ALL CAPS
    /!{3,}/,                                        // Multiple exclamation marks
    /https?:\/\/[^\s]+/g,                           // URLs
    /spam|scam|click here|buy now|free money/i      // Spam words
  ]
}

// Content validation function
function validateContent(content: string, fieldName: string): { valid: boolean; reason?: string } {
  if (content.length > securityConfig.maxContentLength) {
    return { valid: false, reason: `${fieldName} too long (max ${securityConfig.maxContentLength} characters)` }
  }
  
  for (const pattern of securityConfig.suspiciousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, reason: `Suspicious content detected in ${fieldName}` }
    }
  }
  
  return { valid: true }
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

  const {
    type,
    title,
    description,
    sentiment,
    screenshot,
    userJourney,
    feedbackContext,
  } = parsedBody.data;

  const missingFields: Record<string, string> = {};
  if (!type) missingFields.type = 'Type is required';
  if (!title) missingFields.title = 'Title is required';
  if (!description) missingFields.description = 'Description is required';
  if (!sentiment) missingFields.sentiment = 'Sentiment is required';

  if (Object.keys(missingFields).length > 0) {
    return validationError(missingFields, 'Missing required fields');
  }

  if (!FEEDBACK_TYPES.includes(type as (typeof FEEDBACK_TYPES)[number])) {
    return validationError({ type: 'Invalid feedback type' });
  }

  if (!SENTIMENT_VALUES.includes(sentiment as (typeof SENTIMENT_VALUES)[number])) {
    return validationError({ sentiment: 'Invalid sentiment value' });
  }

  const titleValidation = validateContent(title, 'title');
  if (!titleValidation.valid) {
    return validationError({ title: titleValidation.reason ?? 'Invalid title' });
  }

  const descriptionValidation = validateContent(description, 'description');
  if (!descriptionValidation.valid) {
    return validationError({
      description: descriptionValidation.reason ?? 'Invalid description',
    });
  }

  const supabasePromise = getSupabaseServerClient();
  if (!supabasePromise) {
    devLog('Supabase not configured - using mock response');
    return successResponse(
      buildFeedbackResponse(`mock-${Date.now()}`, userJourney),
      { source: 'mock', mode: 'degraded' }
    );
  }

  const supabaseClient = await supabasePromise;

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
      description: `CSP Violation: ${description}`,
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
      .insert(stripUndefinedDeep(cspData))
      .select()
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

  const metadataPayload: Json = {
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
  };

  const priority =
    type === 'security'
      ? 'urgent'
      : type === 'bug' || type === 'correction'
        ? 'high'
        : 'medium';

  const feedbackData = {
    user_id: user?.id ?? null,
    feedback_type: type,
    title: title.trim(),
    description: description.trim(),
    sentiment,
    screenshot: screenshot ?? null,
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
    sessionId: userJourney?.sessionId,
    currentPage: userJourney?.currentPage,
    deviceType: userJourney?.deviceInfo?.type,
  });

  const { data, error } = await supabaseClient.from('feedback').insert([stripUndefinedDeep(feedbackData)]).select();

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
        buildFeedbackResponse(
          `mock-${Date.now()}`,
          userJourney,
          'Feedback submitted successfully (mock - schema cache issue)'
        ),
        { source: 'mock', fallback: 'schema-cache' }
      );
    }

    return errorResponse(
      'Failed to save feedback',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  const insertedRecord =
    data && !('error' in data) && Array.isArray(data) && data[0] && 'id' in data[0]
      ? (data[0] as { id: string }).id
      : null;

  devLog('Enhanced feedback submitted:', {
    type,
    sentiment,
    page: userJourney?.currentPage,
    device: userJourney?.deviceInfo?.type,
    browser: userJourney?.deviceInfo?.browser,
    os: userJourney?.deviceInfo?.os,
    sessionId: userJourney?.sessionId,
    timestamp: new Date().toISOString(),
    user_id: user?.id ? 'authenticated' : 'anonymous',
    performance: {
      pageLoadTime: userJourney?.pageLoadTime,
      timeOnPage: userJourney?.timeOnPage,
    },
    errors: userJourney?.errors?.length ?? 0,
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

  const supabasePromise = getSupabaseServerClient();
  if (!supabasePromise) {
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

  const supabaseClient = await supabasePromise;

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
