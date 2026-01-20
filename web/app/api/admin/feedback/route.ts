import { getSupabaseServerClient } from '@/utils/supabase/server';

import { requireAdminOr401, getAdminUser } from '@/features/auth/lib/admin-auth';

import { successResponse, errorResponse, withErrorHandling } from '@/lib/api';
import { devLog } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const authGate = await requireAdminOr401();
    if (authGate) return authGate;

    const adminUser = await getAdminUser();

    if (!adminUser) {
      devLog('No admin user found');
      return errorResponse('Admin access required', 403);
    }

    // Get Supabase client - use server client with authenticated admin user
    // (service role client has RLS issues, server client with admin user works)
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return errorResponse('Database connection not available', 500);
    }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const sentiment = searchParams.get('sentiment');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const dateRange = searchParams.get('dateRange') ?? 'all';
  const search = searchParams.get('search') ?? '';

  // Build query
  let query = supabase
    .from('feedback')
    .select('id, user_id, feedback_type, title, description, sentiment, status, priority, created_at, updated_at, tags, user_journey, ai_analysis, metadata, admin_response, admin_response_at, admin_response_by')
    .order('created_at', { ascending: false });

  // Apply filters
  // Note: Database column is 'feedback_type', but we accept 'type' as query param for compatibility
  if (type) {
    query = query.eq('feedback_type', type);
  }

  if (sentiment) {
    query = query.eq('sentiment', sentiment);
  }

  if (status?.trim()) {
    // Map UI status values to database values
    const dbStatus = status === 'inprogress' ? 'in_progress' : status;
    query = query.eq('status', dbStatus);
  }

  if (priority) {
    query = query.eq('priority', priority);
  }

  // Apply date range filter
  if (dateRange !== 'all') {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      }
      default:
        startDate = new Date(0);
    }

    query = query.gte('created_at', startDate.toISOString());
  }

  // Apply search filter
  if (search.trim() !== '') {
    // Use ilike for case-insensitive search on title and description
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Execute query
  const { data: feedback, error } = await query;

  if (error) {
    devLog('Error fetching feedback:', { error, errorMessage: error.message, errorDetails: error.details, errorHint: error.hint });
    return errorResponse(`Failed to fetch feedback: ${error.message}`, 500);
  }

  // Apply additional search filtering if needed (for fields not in the database)
  let filteredFeedback = feedback ?? [];
  if (feedback) {
    filteredFeedback = feedback.filter((item: { title?: string; description?: string }) => {
      const searchLower = search.toLowerCase();
      const itemAny = item as any;
      const titleMatch = item && 'title' in item ? item.title?.toLowerCase().includes(searchLower) ?? false : false;
      const descMatch = item && 'description' in item ? item.description?.toLowerCase().includes(searchLower) ?? false : false;
      const tagsMatch = item && 'tags' in item ? (itemAny.tags as string[])?.some((tag: string) => tag.toLowerCase().includes(searchLower)) ?? false : false;
      return titleMatch ?? descMatch ?? tagsMatch;
    });
  }

  return successResponse({
    feedback: filteredFeedback,
    total: filteredFeedback.length,
    admin: {
      id: adminUser?.id,
      email: adminUser?.email
    },
    filters: {
      type,
      sentiment,
      status,
      priority,
      dateRange,
      search
    }
  });
  } catch (error) {
    devLog('Unexpected error in GET /api/admin/feedback:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return errorResponse('Internal server error', 500);
  }
});
