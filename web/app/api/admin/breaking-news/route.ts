import { z } from 'zod';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';

import { withErrorHandling, successResponse, errorResponse, authError, validationError } from '@/lib/api';
import { RealTimeNewsService } from '@/lib/core/services/real-time-news';
import { createAuditLogService } from '@/lib/services/audit-log-service';

import type { NextRequest } from 'next/server';

// Validation schema for breaking news creation
// Note: fullStory and sourceUrl are required by the service, entities must be NewsEntity[]
const breakingNewsSchema = z.object({
  headline: z.string().min(1, 'Headline is required').max(500, 'Headline must be at most 500 characters'),
  summary: z.string().min(1, 'Summary is required').max(2000, 'Summary must be at most 2000 characters'),
  fullStory: z.string().max(10000, 'Full story must be at most 10000 characters').default(''),
  sourceUrl: z.string().url('Source URL must be a valid URL').default(''),
  sourceName: z.string().min(1, 'Source name is required').max(200, 'Source name must be at most 200 characters'),
  sourceReliability: z.number().min(0).max(1).optional().default(0.9),
  category: z.array(z.string()).max(20, 'Maximum 20 categories allowed').optional().default([]),
  urgency: z.enum(['low', 'medium', 'high', 'breaking']).optional().default('medium'),
  sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']).optional().default('neutral'),
  entities: z.array(z.object({
    name: z.string(),
    type: z.enum(['person', 'organization', 'location', 'event', 'policy', 'concept']).optional(),
    confidence: z.number().min(0).max(1).optional(),
    role: z.string().optional(),
    stance: z.enum(['support', 'oppose', 'neutral', 'unknown']).optional(),
    metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })).max(50, 'Maximum 50 entities allowed').optional().default([]),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});


export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  const supabase = getSupabaseServerClient();
  const supabaseClient = await supabase;
  
  if (!supabaseClient) {
    return errorResponse('Supabase client not available', 500);
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const urgency = searchParams.get('urgency');
  const category = searchParams.get('category');

  const service = new RealTimeNewsService();
  let stories = await service.getBreakingNews(limit);

  if (urgency) {
    stories = stories.filter(story => story.urgency === urgency);
  }

  if (category) {
    stories = stories.filter(story => story.category.includes(category));
  }

  return successResponse({
    stories,
    count: stories.length,
    filters: {
      urgency,
      category,
      limit
    }
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  const supabase = getSupabaseServerClient();
  const supabaseClient = await supabase;
  
  if (!supabaseClient) {
    return errorResponse('Supabase client not available', 500);
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return authError('Authentication required');
  }

  // Parse and validate request body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return validationError({ body: 'Request body must be valid JSON' });
  }

  // Validate with Zod schema
  const validationResult = breakingNewsSchema.safeParse(rawBody);
  if (!validationResult.success) {
    const fieldErrors: Record<string, string> = {};
    validationResult.error.issues.forEach((issue) => {
      const field = issue.path.join('.') || 'body';
      fieldErrors[field] = issue.message;
    });
    return validationError(fieldErrors, 'Invalid breaking news data');
  }

  const {
    headline,
    summary,
    fullStory,
    sourceUrl,
    sourceName,
    sourceReliability,
    category,
    urgency,
    sentiment,
    entities,
    metadata,
  } = validationResult.data;

  const service = new RealTimeNewsService();
  // Transform metadata to match service expectations
  const serviceMetadata = {
    keywords: Array.isArray(metadata?.keywords) ? metadata.keywords : [],
    controversy: typeof metadata?.controversy === 'number' ? metadata.controversy : 0,
    timeSensitivity: (metadata?.timeSensitivity as 'low' | 'medium' | 'high') ?? 'medium',
    geographicScope: (metadata?.geographicScope as 'local' | 'national' | 'international' | 'global') ?? 'national',
    politicalImpact: typeof metadata?.politicalImpact === 'number' ? metadata.politicalImpact : 0,
    publicInterest: typeof metadata?.publicInterest === 'number' ? metadata.publicInterest : 0,
    complexity: (metadata?.complexity as 'low' | 'medium' | 'high') ?? undefined,
  };
  
  const story = await service.createBreakingNews({
    headline,
    summary,
    fullStory: fullStory ?? '',
    sourceUrl: sourceUrl ?? '',
    sourceName,
    sourceReliability,
    category,
    urgency,
    sentiment,
    entities: entities as any, // Service expects NewsEntity[] but accepts transformed data
    metadata: serviceMetadata
  });

  if (!story) {
    return errorResponse('Failed to create breaking news story', 500);
  }

  const auditLog = createAuditLogService(supabaseClient);
  await auditLog.logAdminAction(user.id, 'breaking_news:create', '/api/admin/breaking-news', {
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    metadata: {
      headline,
      urgency,
      categories: category,
      storyId: story.id ?? null
    }
  });

  return successResponse({
    story,
    message: 'Breaking news story created successfully'
  }, undefined, 201);
});
