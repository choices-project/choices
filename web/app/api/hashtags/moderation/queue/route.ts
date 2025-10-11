/**
 * Hashtag Moderation Queue API Endpoint
 * 
 * Returns hashtags requiring moderation review
 * 
 * Created: October 11, 2025
 * Status: ✅ ACTIVE
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';
import { getModerationQueue } from '@/features/hashtags/lib/hashtag-moderation';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'approved' | 'pending' | 'rejected' | 'flagged' | undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Get moderation queue
    const result = await getModerationQueue(status, limit);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    logger.info(`Moderation queue requested by ${profile.role} ${user.id}: ${result.data?.length || 0} items`);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error in moderation queue API:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
