/**
 * Representative Follow/Unfollow API Endpoint
 * 
 * Handles following and unfollowing representatives
 * 
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 */

import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/representatives/[id]/follow
 * Follow a representative
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const representativeId = parseInt(params.id);
    
    if (isNaN(representativeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid representative ID' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify representative exists
    const { data: representative, error: repError } = await supabase
      .from('representatives_core')
      .select('id')
      .eq('id', representativeId)
      .single();

    if (repError || !representative) {
      return NextResponse.json(
        { success: false, error: 'Representative not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const { data: existing } = await (supabase as any)
      .from('user_followed_representatives')
      .select('id')
      .eq('user_id', user.id)
      .eq('representative_id', representativeId)
      .single();

    if (existing) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Already following this representative',
          following: true 
        },
        { status: 200 }
      );
    }

    // Insert follow relationship
    const { data: followData, error: followError } = await (supabase as any)
      .from('user_followed_representatives')
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
      return NextResponse.json(
        { success: false, error: 'Failed to follow representative' },
        { status: 500 }
      );
    }

    logger.info('User followed representative', {
      userId: user.id,
      representativeId
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully followed representative',
      data: followData,
      following: true
    });

  } catch (error) {
    logger.error('Unexpected error in follow endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/representatives/[id]/follow
 * Unfollow a representative
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const representativeId = parseInt(params.id);
    
    if (isNaN(representativeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid representative ID' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Delete follow relationship
    const { error: unfollowError } = await (supabase as any)
      .from('user_followed_representatives')
      .delete()
      .eq('user_id', user.id)
      .eq('representative_id', representativeId);

    if (unfollowError) {
      logger.error('Error unfollowing representative:', unfollowError);
      return NextResponse.json(
        { success: false, error: 'Failed to unfollow representative' },
        { status: 500 }
      );
    }

    logger.info('User unfollowed representative', {
      userId: user.id,
      representativeId
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed representative',
      following: false
    });

  } catch (error) {
    logger.error('Unexpected error in unfollow endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/representatives/[id]/follow
 * Check if user is following a representative
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const representativeId = parseInt(params.id);
    
    if (isNaN(representativeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid representative ID' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', following: false },
        { status: 401 }
      );
    }

    // Check if following
    const { data: followData, error: followError } = await (supabase as any)
      .from('user_followed_representatives')
      .select('*')
      .eq('user_id', user.id)
      .eq('representative_id', representativeId)
      .single();

    if (followError && followError.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Error checking follow status:', followError);
      return NextResponse.json(
        { success: false, error: 'Failed to check follow status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      following: !!followData,
      data: followData ?? null
    });

  } catch (error) {
    logger.error('Unexpected error in check follow endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

