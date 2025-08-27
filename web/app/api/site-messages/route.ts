import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeExpired = searchParams.get('includeExpired') === 'true'

    const messages = await getActiveSiteMessages(supabase, includeExpired)
    return NextResponse.json(messages)
  } catch (error) {
    logger.error('Error fetching public site messages', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to fetch site messages' },
      { status: 500 }
    )
  }
}

async function getActiveSiteMessages(supabase: any, includeExpired: boolean = false) {
  try {
    // Use REST API directly to bypass PostgREST cache issues
    let url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_messages?select=*&is_active=eq.true&order=priority.desc,created_at.desc`
    
    if (!includeExpired) {
      url += `&expires_at=is.null`
    }

    const response = await fetch(url, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const messages = await response.json();

    return {
      messages: messages || [],
      count: messages?.length || 0,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Error in getActiveSiteMessages', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

