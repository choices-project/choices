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
    // Log error but return empty array instead of failing
    // This ensures the API always returns a valid response
    logger.warn('Error fetching site messages (returning empty):', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return success response with empty data instead of error
    // This prevents the API from returning 500 errors
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
    // Start with base query for active messages
    let query = supabase
      .from('site_messages')
      .select('*')
      .eq('is_active', true);

    // Filter by date range if not including expired
    // Use proper Supabase query syntax for date filtering
    if (!includeExpired) {
      // Messages that are currently active:
      // - start_date is null OR start_date <= now
      // - AND end_date is null OR end_date >= now
      query = query
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`);
    }

    // Order by priority (high to low) then by created_at (newest first)
    // Note: Supabase doesn't support multiple .order() calls, use a single order with array
    query = query.order('priority', { ascending: false });

    const { data: messages, error } = await query;

    if (error) {
      logger.error('Supabase error fetching site messages', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      // Don't throw - return empty array instead to prevent API failures
      // The error is already logged for debugging
      return {
        messages: [],
        count: 0,
        timestamp: new Date().toISOString()
      };
    }

    // Sort by priority then created_at (since Supabase order is limited)
    const sortedMessages = (messages || []).sort((a, b) => {
      // Priority order: critical > high > medium > low
      const priorityOrder: Record<string, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;

      // Then by created_at (newest first)
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return {
      messages: sortedMessages,
      count: sortedMessages.length,
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

