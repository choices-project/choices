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
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      logger.error('Missing Supabase environment variables', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceRoleKey,
      });
      throw new Error('Supabase configuration missing');
    }
    
    // Create Supabase client with service role key and proper auth config
    // Service role key bypasses RLS, so we don't need user session
    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false, // Don't persist session for service role
          autoRefreshToken: false, // No token refresh needed for service role
        },
      }
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
      logger.error('Supabase error fetching site messages', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    return {
      messages: messages || [],
      count: messages?.length || 0,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Error in getActiveSiteMessages', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

