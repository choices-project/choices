import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeExpired = searchParams.get('includeExpired') === 'true'

    const messages = await getActiveSiteMessages(includeExpired)
    return NextResponse.json(messages)
  } catch (error) {
    logger.error('Error fetching public site messages', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to fetch site messages' },
      { status: 500 }
    )
  }
}

async function getActiveSiteMessages(includeExpired: boolean = false) {
  try {
    let query = supabase
      .from('site_messages')
      .select('id, title, message, type, priority, created_at, updated_at, expires_at')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (!includeExpired) {
      const now = new Date().toISOString()
      query = query.or(`expires_at.is.null,expires_at.gt.${now}`)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching active site messages from database', { error: error.message })
      throw error
    }

    return {
      messages: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Error in getActiveSiteMessages', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

