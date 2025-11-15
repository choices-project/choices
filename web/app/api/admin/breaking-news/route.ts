import type { NextRequest} from 'next/server';

import { requireAdminOr401 } from '@/lib/admin-auth';
import { withErrorHandling, successResponse, errorResponse, authError, validationError } from '@/lib/api';
import { RealTimeNewsService } from '@/lib/core/services/real-time-news';
import { createAuditLogService } from '@/lib/services/audit-log-service';
import { getSupabaseServerClient } from '@/utils/supabase/server';

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

  const body = await request.json().catch(() => null);
  const {
    headline,
    summary,
    fullStory,
    sourceUrl,
    sourceName,
    sourceReliability = 0.9,
    category = [],
    urgency = 'medium',
    sentiment = 'neutral',
    entities = [],
    metadata = {}
  } = body;

  if (!headline || !summary || !sourceName) {
    return validationError({
      headline: headline ? '' : 'Headline is required',
      summary: summary ? '' : 'Summary is required',
      sourceName: sourceName ? '' : 'Source name is required'
    });
  }

  if (!Array.isArray(category) || !Array.isArray(entities)) {
    return validationError({
      category: Array.isArray(category) ? '' : 'Category must be an array',
      entities: Array.isArray(entities) ? '' : 'Entities must be an array'
    }, 'Invalid payload shape');
  }

  const service = new RealTimeNewsService();
  const story = await service.createBreakingNews({
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
    metadata
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
