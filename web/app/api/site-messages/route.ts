import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeExpired = searchParams.get('includeExpired') === 'true'

    const messages = await getActiveSiteMessages(includeExpired)
    return NextResponse.json(messages)
  } catch (error) {
    // Fail gracefully - return empty array instead of 500 error
    logger.warn('Error fetching public site messages (non-critical):', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({
      messages: [],
      count: 0,
      timestamp: new Date().toISOString()
    })
  }
}

async function getActiveSiteMessages(includeExpired: boolean = false) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    // Create Supabase client properly
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
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

