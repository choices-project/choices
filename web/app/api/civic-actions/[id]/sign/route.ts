/**
 * Civic Actions Sign/Endorse API
 * 
 * POST /api/civic-actions/[id]/sign - Sign/endorse a civic action (petition, etc.)
 * 
 * Feature Flag: CIVIC_ENGAGEMENT_V2
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  withErrorHandling,
  successResponse,
  validationError,
  errorResponse,
  notFoundError,
  methodNotAllowed,
} from '@/lib/api';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

/**
 * POST /api/civic-actions/[id]/sign - Sign/endorse a civic action
 */
export const POST = withErrorHandling(async (
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
  const rateLimitResult = await apiRateLimiter.checkLimit(ip, `/api/civic-actions/${id}/sign`, {
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

  try {
    // Check if action exists and is active
    const { data: action, error: fetchError } = await supabase
      .from('civic_actions')
      .select('id, status, is_public, current_signatures, required_signatures, end_date, action_type')
      .eq('id', id)
      .single();

    if (fetchError || !action) {
      return notFoundError('Civic action not found');
    }

    // Check if action is active
    if (action.status !== 'active') {
      return errorResponse('This action is not currently active', 400);
    }

    // Check if action has ended
    if (action.end_date && new Date(action.end_date) < new Date()) {
      return errorResponse('This action has ended', 400);
    }

    // Check if user has already signed (using metadata to track signatures)
    // In a production system, you might want a separate civic_action_signatures table
    const { data: existingAction } = await supabase
      .from('civic_actions')
      .select('metadata')
      .eq('id', id)
      .single();

    const metadata = (existingAction?.metadata as Record<string, unknown>) ?? {};
    const signatures = (metadata.signatures as string[]) ?? [];

    if (signatures.includes(user.id)) {
      return errorResponse('You have already signed this action', 400);
    }

    // Add user to signatures list
    const updatedSignatures = [...signatures, user.id];
    const newSignatureCount = (action.current_signatures ?? 0) + 1;

    // Update action with new signature
    const { data: updatedAction, error: updateError } = await supabase
      .from('civic_actions')
      .update({
        current_signatures: newSignatureCount,
        metadata: {
          ...metadata,
          signatures: updatedSignatures,
          last_signed_at: new Date().toISOString(),
        },
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logger.error('Error signing civic action', updateError);
      return errorResponse('Failed to sign civic action', 500);
    }

    // Track analytics event
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'civic_action_signed',
        user_id: user.id,
        event_data: {
          action_id: id,
          action_type: action.action_type,
          signature_count: newSignatureCount,
        },
      });
    } catch (analyticsError) {
      // Non-blocking: log but don't fail the request
      logger.warn('Failed to track analytics for civic action sign', analyticsError);
    }

    logger.info('Civic action signed', {
      actionId: id,
      userId: user.id,
      signatureCount: newSignatureCount,
    });

    return successResponse(
      {
        signed: true,
        signature_count: newSignatureCount,
        action: updatedAction,
      },
      { signed: true }
    );
  } catch (error) {
    logger.error('Unexpected error signing civic action', error);
    return errorResponse('Internal server error', 500);
  }
});

export const GET = withErrorHandling(async () => methodNotAllowed(['POST']));
export const PUT = withErrorHandling(async () => methodNotAllowed(['POST']));
export const PATCH = withErrorHandling(async () => methodNotAllowed(['POST']));
export const DELETE = withErrorHandling(async () => methodNotAllowed(['POST']));

