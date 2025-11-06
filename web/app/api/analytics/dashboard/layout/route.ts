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

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// GET - Load Dashboard Layout
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'userId required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    
    // Get user's dashboard layout from user_profiles
    const { data: profile, error } = await (supabase as any)
      .from('user_profiles')
      .select('dashboard_layout')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      logger.error('Failed to fetch dashboard layout', { error, userId });
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch layout' },
        { status: 500 }
      );
    }

    // If no layout found, return 404
    if (!profile || !profile.dashboard_layout) {
      return NextResponse.json(
        { ok: false, error: 'No layout found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      ...profile.dashboard_layout,
    });

  } catch (error) {
    logger.error('GET /api/analytics/dashboard/layout error', { error });
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Save Dashboard Layout
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const layout = await request.json();

    if (!layout.userId) {
      return NextResponse.json(
        { ok: false, error: 'userId required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { ok: false, error: 'Failed to save layout' },
        { status: 500 }
      );
    }

    logger.info('Dashboard layout saved', { userId: layout.userId, widgetCount: layout.widgets?.length });

    return NextResponse.json({
      ok: true,
      message: 'Layout saved successfully',
    });

  } catch (error) {
    logger.error('POST /api/analytics/dashboard/layout error', { error });
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Dashboard Layout (Reset to Default)
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'userId required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    
    // Remove dashboard layout (user will get default on next load)
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({ dashboard_layout: null })
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to delete dashboard layout', { error, userId });
      return NextResponse.json(
        { ok: false, error: 'Failed to delete layout' },
        { status: 500 }
      );
    }

    logger.info('Dashboard layout deleted', { userId });

    return NextResponse.json({
      ok: true,
      message: 'Layout reset to default',
    });

  } catch (error) {
    logger.error('DELETE /api/analytics/dashboard/layout error', { error });
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

