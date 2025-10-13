/**
 * Consolidated Hashtags API Endpoint
 * 
 * This endpoint consolidates all hashtag functionality:
 * - Hashtag flagging
 * - Hashtag moderation
 * - Moderation queue
 * - Hashtag approval/rejection
 * 
 * Usage:
 * GET /api/hashtags?action=moderation-queue - Get moderation queue
 * POST /api/hashtags?action=flag - Flag a hashtag
 * POST /api/hashtags?action=approve&flagId={id} - Approve a flag
 * POST /api/hashtags?action=reject&flagId={id} - Reject a flag
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get moderation queue
    if (action === 'moderation-queue') {
      const { data: flags, error } = await supabase
        .from('hashtag_flags')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch moderation queue', { error });
        return NextResponse.json(
          { error: 'Failed to fetch moderation queue' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: flags,
        metadata: {
          count: flags?.length || 0,
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Hashtags GET error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const flagId = url.searchParams.get('flagId');

    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Flag a hashtag
    if (action === 'flag') {
      const body = await request.json();
      
      const { data, error } = await supabase
        .from('hashtag_flags')
        .insert([{
          hashtag: body.hashtag,
          reason: body.reason,
          reporter_id: body.reporter_id,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        logger.error('Failed to create hashtag flag', { error });
        return NextResponse.json(
          { error: 'Failed to create hashtag flag' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data[0],
        message: 'Hashtag flagged successfully'
      });
    }

    // Approve a flag
    if (action === 'approve' && flagId) {
      const { data, error } = await supabase
        .from('hashtag_flags')
        .update({ status: 'approved' })
        .eq('id', flagId)
        .select();

      if (error) {
        logger.error('Failed to approve hashtag flag', { error });
        return NextResponse.json(
          { error: 'Failed to approve hashtag flag' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data[0],
        message: 'Hashtag flag approved'
      });
    }

    // Reject a flag
    if (action === 'reject' && flagId) {
      const { data, error } = await supabase
        .from('hashtag_flags')
        .update({ status: 'rejected' })
        .eq('id', flagId)
        .select();

      if (error) {
        logger.error('Failed to reject hashtag flag', { error });
        return NextResponse.json(
          { error: 'Failed to reject hashtag flag' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data[0],
        message: 'Hashtag flag rejected'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Hashtags POST error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
