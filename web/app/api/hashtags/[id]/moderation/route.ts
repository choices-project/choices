/**
 * Individual Hashtag Moderation API Endpoint
 * 
 * Returns moderation status for a specific hashtag
 * 
 * Created: October 11, 2025
 * Status: ✅ ACTIVE
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getHashtagModeration } from '@/features/hashtags/lib/hashtag-moderation';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const hashtagId = params.id;

    if (!hashtagId) {
      return NextResponse.json(
        { success: false, error: 'Hashtag ID is required' },
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

    // Get moderation status
    const result = await getHashtagModeration(hashtagId);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    logger.info(`Moderation status requested for hashtag ${hashtag.name} by user ${user.id}`);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error in hashtag moderation status API:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
