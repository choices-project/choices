/**
 * Hashtag Moderation API Endpoint
 * 
 * Handles admin moderation actions for hashtags
 * 
 * Created: October 11, 2025
 * Status: ✅ ACTIVE
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';
import { moderateHashtag } from '@/features/hashtags/lib/hashtag-moderation';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin/moderator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { hashtagId, status, reason } = body;

    // Validate input
    if (!hashtagId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: hashtagId, status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['approved', 'rejected', 'flagged', 'pending'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid moderation status' },
        { status: 400 }
      );
    }

    // Check if hashtag exists
    const { data: hashtag, error: hashtagError } = await supabase
      .from('hashtags')
      .select('id, name')
      .eq('id', hashtagId)
      .single();

    if (hashtagError || !hashtag) {
      return NextResponse.json(
        { success: false, error: 'Hashtag not found' },
        { status: 404 }
      );
    }

    // Perform moderation action
    const result = await moderateHashtag(hashtagId, status, reason);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    logger.info(`Hashtag moderated: ${hashtag.name} -> ${status} by ${profile.role} ${user.id}`);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error in hashtag moderation API:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
