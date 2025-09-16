import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/core/services/analytics'
import { devLog } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const analyticsService = AnalyticsService.getInstance()
    const userAnalytics = await analyticsService.getUserAnalytics(userId)

    return NextResponse.json({
      success: true,
      data: userAnalytics
    })

  } catch (error) {
    devLog('Error getting user analytics:', error)
    return NextResponse.json(
      { error: 'Failed to get user analytics' },
      { status: 500 }
    )
  }
}
