import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, validationError, notFoundError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';



export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const representativeId = parseInt(params.id);

  if (isNaN(representativeId)) {
    return validationError({ id: 'Invalid representative ID' });
  }

  const supabase = await getSupabaseServerClient();
  const adminSupabase = await getSupabaseAdminClient();

  if (!supabase || !adminSupabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return authError('Authentication required');
  }

    // Verify representative exists
    const { data: representative, error: repError } = await adminSupabase
      .from('representatives_core')
      .select('id')
      .eq('id', representativeId)
      .single();

  if (repError || !representative) {
    return notFoundError('Representative not found');
  }

    // Check if already following
    const { data: existing } = await (adminSupabase as any)
      .from('representative_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('representative_id', representativeId)
      .single();

  if (existing) {
    return successResponse({
      message: 'Already following this representative',
      following: true,
      follow: existing
    });
  }

    // Insert follow relationship
    const { data: followData, error: followError } = await (adminSupabase as any)
      .from('representative_follows')
      .insert({
        user_id: user.id,
        representative_id: representativeId,
        notify_on_votes: true,
        notify_on_committee_activity: false,
        notify_on_public_statements: false,
        notify_on_events: false
      })
      .select()
      .single();

  if (followError) {
    logger.error('Error following representative:', followError);
    return errorResponse('Failed to follow representative', 500);
  }

  logger.info('User followed representative', {
    userId: user.id,
    representativeId
  });

  return successResponse({
    message: 'Successfully followed representative',
    follow: followData,
    following: true
  }, undefined, 201);
});

export const DELETE = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const representativeId = parseInt(params.id);

  if (isNaN(representativeId)) {
    return validationError({ id: 'Invalid representative ID' });
  }

  const supabase = await getSupabaseServerClient();
  const adminSupabase = await getSupabaseAdminClient();

  if (!supabase || !adminSupabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return authError('Authentication required');
  }

    // Delete follow relationship
    const { error: unfollowError } = await (adminSupabase as any)
      .from('representative_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('representative_id', representativeId);

  if (unfollowError) {
    logger.error('Error unfollowing representative:', unfollowError);
    return errorResponse('Failed to unfollow representative', 500);
  }

  logger.info('User unfollowed representative', {
    userId: user.id,
    representativeId
  });

  return successResponse({
    message: 'Successfully unfollowed representative',
    following: false
  });
});

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const representativeId = parseInt(params.id);

  if (isNaN(representativeId)) {
    return validationError({ id: 'Invalid representative ID' });
  }

  const supabase = await getSupabaseServerClient();
  const adminSupabase = await getSupabaseAdminClient();

  if (!supabase || !adminSupabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return authError('Authentication required');
  }

    // Check if following
    const { data: followData, error: followError } = await (adminSupabase as any)
      .from('representative_follows')
      .select('*')
      .eq('user_id', user.id)
      .eq('representative_id', representativeId)
      .single();

  if (followError && followError.code !== 'PGRST116') {
    logger.error('Error checking follow status:', followError);
    return errorResponse('Failed to check follow status', 500);
  }

  return successResponse({
    following: !!followData,
    follow: followData ?? null
  });
});

