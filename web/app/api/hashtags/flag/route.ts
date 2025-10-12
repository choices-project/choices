/**
 * Hashtag Flagging API Endpoint
 * 
 * Handles user flagging of hashtags for moderation
 * 
 * Created: October 11, 2025
 * Status: ✅ ACTIVE
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { flagHashtag } from '@/features/hashtags/lib/hashtag-moderation';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

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

    const body = await request.json();
    const { hashtagId, flagType, reason } = body;

    // Validate input
    if (!hashtagId || !flagType || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: hashtagId, flagType, reason' },
        { status: 400 }
      );
    }

    // Validate flag type
    const validFlagTypes = ['inappropriate', 'spam', 'misleading', 'duplicate', 'other'];
    if (!validFlagTypes.includes(flagType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid flag type' },
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

    // Create the flag
    const result = await flagHashtag(hashtagId, flagType, reason);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    logger.info(`Hashtag flagged: ${hashtag.name} (${flagType}) by user ${user.id}`);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error in hashtag flagging API:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
