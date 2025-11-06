// NextRequest import removed - not used
import { NextResponse } from 'next/server'

import { AnalyticsService } from '@/lib/core/services/analytics'
import { devLog } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const analyticsService = AnalyticsService.getInstance()
    const summary = await analyticsService.getAnalyticsSummary()

    return NextResponse.json({
      success: true,
      data: summary
    })

  } catch (error) {
    devLog('Error getting analytics summary:', error)
    return NextResponse.json(
      { error: 'Failed to get analytics summary' },
      { status: 500 }
    )
  }
}
