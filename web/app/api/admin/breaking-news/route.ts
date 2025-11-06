import type { NextRequest} from 'next/server';

import { requireAdminOr401 } from '@/lib/admin-auth';
import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { RealTimeNewsService } from '@/lib/core/services/real-time-news';
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

  const body = await request.json();
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
    return errorResponse('Headline, summary, and source name are required', 400);
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

  return successResponse({
    story,
    message: 'Breaking news story created successfully'
  }, undefined, 201);
});
