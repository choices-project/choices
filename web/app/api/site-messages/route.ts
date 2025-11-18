import type { NextRequest} from 'next/server';

import { withErrorHandling, successResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const includeExpired = searchParams.get('includeExpired') === 'true'

  try {
    const messages = await getActiveSiteMessages(includeExpired)
    return successResponse(messages);
  } catch (error) {
    logger.warn('Error fetching site messages (returning empty):', error instanceof Error ? error : new Error(String(error)))
    return successResponse({
      messages: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
});

async function getActiveSiteMessages(includeExpired: boolean = false) {
  try {
    const { createClient } = await import('@supabase/supabase-js');

    // Create Supabase client properly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // In CI/test environments, if Supabase is not configured, return empty messages
    // This allows the app to build and run tests without real Supabase credentials
    if (!supabaseUrl || !supabaseKey) {
      if (process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
        logger.warn('Supabase not configured in CI/test; returning empty site messages');
        return {
          messages: [],
          count: 0,
          timestamp: new Date().toISOString()
        };
      }
      throw new Error('Supabase environment variables are not configured');
    }
    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    );

    const now = new Date().toISOString();

    // Build query with correct column names
    let query = supabase
      .from('site_messages')
      .select('*')
      .eq('is_active', true);

    // Filter by date range if not including expired
    if (!includeExpired) {
      query = query
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`);
    }

    query = query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    const { data: messages, error } = await query;

    if (error) {
      logger.error('Supabase error fetching site messages:', error);
      throw error;
    }

    return {
      messages: messages || [],
      count: messages?.length || 0,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Error in getActiveSiteMessages:', error);
    throw error;
  }
}

