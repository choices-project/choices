import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { AnalyticsService } from '@/lib/core/services/analytics'
import { devLog } from '@/lib/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    const analyticsService = AnalyticsService.getInstance(supabase)
    const pollAnalytics = await analyticsService.getPollAnalytics(pollId)

    return NextResponse.json({
      success: true,
      data: pollAnalytics
    })

  } catch (error) {
    devLog('Error getting poll analytics:', error)
    return NextResponse.json(
      { error: 'Failed to get poll analytics' },
      { status: 500 }
    )
  }
}
