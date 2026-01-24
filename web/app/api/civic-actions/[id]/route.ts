/**
 * Civic Actions API - Single Action Operations
 *
 * GET /api/civic-actions/[id] - Get a single civic action
 * PATCH /api/civic-actions/[id] - Update a civic action
 * DELETE /api/civic-actions/[id] - Delete a civic action
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
  notFoundError,
  parseBody,
  methodNotAllowed,
} from '@/lib/api';
import { CIVIC_ACTION_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Update schema (all fields optional)
const updateCivicActionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  action_type: z.enum(['petition', 'campaign', 'survey', 'event', 'protest', 'meeting']).optional(),
  category: z.string().min(1).max(100).optional(),
  urgency_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  target_representatives: z.array(z.number()).optional(),
  target_state: z.string().max(2).optional(),
  target_district: z.string().max(50).optional(),
  target_office: z.string().max(100).optional(),
  required_signatures: z.number().int().min(1).max(1000000).optional(),
  end_date: z.string().datetime().optional().nullable(),
  is_public: z.boolean().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/civic-actions/[id] - Get a single civic action
 */
export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return errorResponse('Civic Engagement V2 feature is disabled', 403);
  }

  const { id } = await params;
  if (!id) {
    return validationError({ id: 'Action ID is required' }, 'Invalid request');
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection failed', 500);
  }

  try {
    // Get authenticated user (if any)
    const { data: { user } } = await supabase.auth.getUser();

    // Build query
    const query = supabase
      .from('civic_actions')
      .select(CIVIC_ACTION_SELECT_COLUMNS)
      .eq('id', id)
      .single();

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundError('Civic action not found');
      }
      logger.error('Error fetching civic action', error);
      return errorResponse('Failed to fetch civic action', 500);
    }

    // If user is authenticated, check if they're the creator for access control
    if (user && data.created_by !== user.id) {
      // Check if action is public (is_public column exists in schema)
      // If is_public is false or null, only creator can access
      if (data.is_public !== true) {
        return errorResponse('Access denied: This action is not public', 403);
      }
    }

    return successResponse(data);
  } catch (error) {
    logger.error('Unexpected error fetching civic action', error);
    return errorResponse('Internal server error', 500);
  }
});

/**
 * PATCH /api/civic-actions/[id] - Update a civic action
 */
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return errorResponse('Civic Engagement V2 feature is disabled', 403);
  }

  const { id } = await params;
  if (!id) {
    return validationError({ id: 'Action ID is required' }, 'Invalid request');
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
  const rateLimitResult = await apiRateLimiter.checkLimit(ip, `/api/civic-actions/${id}`, {
    maxRequests: 20,
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

  const validationResult = updateCivicActionSchema.safeParse(parsedBody.data);
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

  try {
    // Check if action exists and user has permission
    const { data: existingAction, error: fetchError } = await supabase
      .from('civic_actions')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingAction) {
      return notFoundError('Civic action not found');
    }

    // Check ownership
    if (existingAction.created_by !== user.id) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (!profile?.is_admin) {
        return errorResponse('Permission denied', 403);
      }
    }

    // Prepare update data
    const updateData: any = {};
    const actionData = validationResult.data;

    if (actionData.title !== undefined) updateData.title = actionData.title;
    if (actionData.description !== undefined) updateData.description = actionData.description;
    if (actionData.action_type !== undefined) updateData.action_type = actionData.action_type;
    if (actionData.category !== undefined) updateData.category = actionData.category;
    if (actionData.urgency_level !== undefined) updateData.urgency_level = actionData.urgency_level;
    if (actionData.is_public !== undefined) updateData.is_public = actionData.is_public;
    if (actionData.status !== undefined) updateData.status = actionData.status;
    if (actionData.required_signatures !== undefined) updateData.required_signatures = actionData.required_signatures;
    if (actionData.end_date !== undefined) updateData.end_date = actionData.end_date;
    if (actionData.metadata !== undefined) updateData.metadata = actionData.metadata;
    if (actionData.target_representatives !== undefined) {
      updateData.target_representatives = actionData.target_representatives;
    }
    if (actionData.target_state !== undefined) updateData.target_state = actionData.target_state;
    if (actionData.target_district !== undefined) updateData.target_district = actionData.target_district;
    if (actionData.target_office !== undefined) updateData.target_office = actionData.target_office;

    // Update action
    const { data: updatedAction, error: updateError } = await supabase
      .from('civic_actions')
      .update(updateData)
      .eq('id', id)
      .select(CIVIC_ACTION_SELECT_COLUMNS)
      .single();

    if (updateError) {
      logger.error('Error updating civic action', updateError);
      return errorResponse('Failed to update civic action', 500);
    }

    logger.info('Civic action updated', {
      actionId: id,
      userId: user.id,
      updatedFields: Object.keys(updateData),
    });

    // Track analytics event
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'civic_action_updated',
        user_id: user.id,
        event_data: {
          action_id: id,
          updated_fields: Object.keys(updateData),
          action_type: updatedAction.action_type,
        },
      });
    } catch (analyticsError) {
      logger.warn('Failed to track analytics for civic action update', analyticsError);
    }

    return successResponse(updatedAction, { updated: true });
  } catch (error) {
    logger.error('Unexpected error updating civic action', error);
    return errorResponse('Internal server error', 500);
  }
});

/**
 * DELETE /api/civic-actions/[id] - Delete a civic action
 */
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return errorResponse('Civic Engagement V2 feature is disabled', 403);
  }

  const { id } = await params;
  if (!id) {
    return validationError({ id: 'Action ID is required' }, 'Invalid request');
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
  const rateLimitResult = await apiRateLimiter.checkLimit(ip, `/api/civic-actions/${id}`, {
    maxRequests: 5,
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

  try {
    // Check if action exists and user has permission
    const { data: existingAction, error: fetchError } = await supabase
      .from('civic_actions')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingAction) {
      return notFoundError('Civic action not found');
    }

    // Check ownership or admin status
    if (existingAction.created_by !== user.id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (!profile?.is_admin) {
        return errorResponse('Permission denied', 403);
      }
    }

    // Delete action
    const { error: deleteError } = await supabase
      .from('civic_actions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('Error deleting civic action', deleteError);
      return errorResponse('Failed to delete civic action', 500);
    }

    logger.info('Civic action deleted', {
      actionId: id,
      userId: user.id,
    });

    // Track analytics event
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'civic_action_deleted',
        user_id: user.id,
        event_data: {
          action_id: id,
        },
      });
    } catch (analyticsError) {
      logger.warn('Failed to track analytics for civic action deletion', analyticsError);
    }

    return successResponse({ deleted: true }, { deleted: true });
  } catch (error) {
    logger.error('Unexpected error deleting civic action', error);
    return errorResponse('Internal server error', 500);
  }
});

export const PUT = withErrorHandling(async () => methodNotAllowed(['GET', 'PATCH', 'DELETE']));
export const POST = withErrorHandling(async () => methodNotAllowed(['GET', 'PATCH', 'DELETE']));

