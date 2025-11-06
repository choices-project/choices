/**
 * Dashboard Layout Persistence API
 * 
 * Save and load customizable widget dashboard layouts.
 * Stores layouts in user_profiles table.
 * 
 * Created: November 5, 2025
 * Updated: November 6, 2025 - Fixed table name (user_profiles)
 * Status: PRODUCTION
 */

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError, notFoundError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return validationError({ userId: 'userId required' });
  }

    const supabase = await getSupabaseServerClient();
    
    // Get user's dashboard layout from user_profiles
    const { data: profile, error } = await (supabase as any)
      .from('user_profiles')
      .select('dashboard_layout')
      .eq('user_id', userId)
      .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to fetch dashboard layout', { error, userId });
    return errorResponse('Failed to fetch layout', 500);
  }

  if (!profile?.dashboard_layout) {
    return notFoundError('No layout found');
  }

  return successResponse({
    ok: true,
    ...profile.dashboard_layout,
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const layout = await request.json();

  if (!layout.userId) {
    return validationError({ userId: 'userId required' });
  }

    const supabase = await getSupabaseServerClient();
    
    // Save layout to user_profiles
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({
        dashboard_layout: {
          id: layout.id,
          name: layout.name,
          description: layout.description,
          widgets: layout.widgets,
          breakpoints: layout.breakpoints,
          isDefault: layout.isDefault,
          isPreset: layout.isPreset,
          createdAt: layout.createdAt,
          updatedAt: new Date().toISOString(),
        },
      })
      .eq('user_id', layout.userId);

  if (error) {
    logger.error('Failed to save dashboard layout', { error, userId: layout.userId });
    return errorResponse('Failed to save layout', 500);
  }

  logger.info('Dashboard layout saved', { userId: layout.userId, widgetCount: layout.widgets?.length });

  return successResponse({
    ok: true,
    message: 'Layout saved successfully',
  }, undefined, 201);
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return validationError({ userId: 'userId required' });
  }

    const supabase = await getSupabaseServerClient();
    
    // Remove dashboard layout (user will get default on next load)
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({ dashboard_layout: null })
      .eq('user_id', userId);

  if (error) {
    logger.error('Failed to delete dashboard layout', { error, userId });
    return errorResponse('Failed to delete layout', 500);
  }

  logger.info('Dashboard layout deleted', { userId });

  return successResponse({
    ok: true,
    message: 'Layout reset to default',
  });
});

