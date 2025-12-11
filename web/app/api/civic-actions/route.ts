/**
 * Civic Actions API - List and Create
 * 
 * GET /api/civic-actions - List civic actions with filtering
 * POST /api/civic-actions - Create a new civic action
 * 
 * Feature Flag: CIVIC_ENGAGEMENT_V2
 */

import { z } from 'zod';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  withErrorHandling,
  successResponse,
  validationError,
  errorResponse,
  parseBody,
  methodNotAllowed,
} from '@/lib/api';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Validation schemas
const createCivicActionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000).optional(),
  action_type: z.enum(['petition', 'campaign', 'survey', 'event', 'protest', 'meeting']),
  category: z.string().min(1).max(100).optional(),
  urgency_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  target_representatives: z.array(z.number()).optional(),
  target_representative_id: z.number().optional(), // Legacy support
  target_state: z.string().max(2).optional(),
  target_district: z.string().max(50).optional(),
  target_office: z.string().max(100).optional(),
  required_signatures: z.number().int().min(1).max(1000000).optional(),
  end_date: z.string().datetime().optional(),
  is_public: z.boolean().default(true),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).default('draft'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listQuerySchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
  action_type: z.enum(['petition', 'campaign', 'survey', 'event', 'protest', 'meeting']).optional(),
  category: z.string().optional(),
  urgency_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  is_public: z.boolean().optional(),
  target_representative_id: z.number().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['created_at', 'current_signatures', 'urgency_level']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/civic-actions - List civic actions
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return errorResponse('Civic Engagement V2 feature is disabled', 403);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection failed', 500);
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  
  const parsedQuery = listQuerySchema.safeParse(queryParams);
  if (!parsedQuery.success) {
    const fieldErrors = parsedQuery.error.flatten().fieldErrors;
    const stringErrors: Record<string, string> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      stringErrors[key] = Array.isArray(value) ? value[0] ?? 'Invalid value' : value ?? 'Invalid value';
    }
    return validationError(stringErrors, 'Invalid query parameters');
  }

  const {
    status,
    action_type,
    category,
    urgency_level,
    is_public,
    target_representative_id,
    limit,
    offset,
    sort,
    order,
  } = parsedQuery.data;

  try {
    // Build query
    let query = supabase
      .from('civic_actions')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (action_type) {
      query = query.eq('action_type', action_type);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (urgency_level) {
      query = query.eq('urgency_level', urgency_level);
    }
    if (is_public !== undefined) {
      query = query.eq('is_public', is_public);
    } else {
      // Default: only show public actions for non-authenticated users
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        query = query.eq('is_public', true);
      }
    }
    if (target_representative_id) {
      query = query.contains('target_representatives', [target_representative_id]);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching civic actions', error);
      return errorResponse('Failed to fetch civic actions', 500);
    }

    return successResponse(
      data ?? [],
      {
        pagination: {
          total: count ?? 0,
          limit,
          offset,
          hasMore: (count ?? 0) > offset + limit,
        },
      }
    );
  } catch (error) {
    logger.error('Unexpected error fetching civic actions', error);
    return errorResponse('Internal server error', 500);
  }
});

/**
 * POST /api/civic-actions - Create a new civic action
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return errorResponse('Civic Engagement V2 feature is disabled', 403);
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
  const rateLimitResult = await apiRateLimiter.checkLimit(ip, '/api/civic-actions', {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rateLimitResult.allowed) {
    return errorResponse('Too many requests. Please try again later.', 429);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection failed', 500);
  }

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse('Authentication required', 401);
  }

  // Parse and validate request body
  const parsedBody = await parseBody(request);
  if (!parsedBody.success) {
    return parsedBody.error;
  }

  const validationResult = createCivicActionSchema.safeParse(parsedBody.data);
  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    const stringErrors: Record<string, string> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      stringErrors[key] = Array.isArray(value) ? value[0] ?? 'Invalid value' : value ?? 'Invalid value';
    }
    return validationError(
      stringErrors,
      'Invalid request data'
    );
  }

  const actionData = validationResult.data;

  try {
    // Prepare insert data
    const insertData: any = {
      title: actionData.title,
      description: actionData.description ?? null,
      action_type: actionData.action_type,
      category: actionData.category ?? null,
      urgency_level: actionData.urgency_level,
      is_public: actionData.is_public,
      status: actionData.status,
      created_by: user.id,
      current_signatures: 0,
      required_signatures: actionData.required_signatures ?? null,
      end_date: actionData.end_date ?? null,
      metadata: actionData.metadata ?? {},
    };

    // Handle target representatives
    if (actionData.target_representatives && actionData.target_representatives.length > 0) {
      insertData.target_representatives = actionData.target_representatives;
    } else if (actionData.target_representative_id) {
      // Legacy support: convert single ID to array
      insertData.target_representatives = [actionData.target_representative_id];
    }

    // Handle target location
    if (actionData.target_state) {
      insertData.target_state = actionData.target_state;
    }
    if (actionData.target_district) {
      insertData.target_district = actionData.target_district;
    }
    if (actionData.target_office) {
      insertData.target_office = actionData.target_office;
    }

    // Insert civic action
    const { data: newAction, error: insertError } = await supabase
      .from('civic_actions')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      logger.error('Error creating civic action', insertError);
      return errorResponse('Failed to create civic action', 500);
    }

    logger.info('Civic action created', {
      actionId: newAction.id,
      title: newAction.title,
      actionType: newAction.action_type,
      userId: user.id,
    });

    // Track analytics event
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'civic_action_created',
        user_id: user.id,
        event_data: {
          action_id: newAction.id,
          action_type: newAction.action_type,
          category: newAction.category,
          urgency_level: newAction.urgency_level,
          is_public: newAction.is_public,
          required_signatures: newAction.required_signatures,
          has_end_date: !!newAction.end_date,
        },
      });
    } catch (analyticsError) {
      // Non-blocking: log but don't fail the request
      logger.warn('Failed to track analytics for civic action creation', analyticsError);
    }

    return successResponse(newAction, { created: true }, 201);
  } catch (error) {
    logger.error('Unexpected error creating civic action', error);
    return errorResponse('Internal server error', 500);
  }
});

export const PUT = withErrorHandling(async () => methodNotAllowed(['GET', 'POST']));
export const DELETE = withErrorHandling(async () => methodNotAllowed(['GET', 'POST']));
export const PATCH = withErrorHandling(async () => methodNotAllowed(['GET', 'POST']));

