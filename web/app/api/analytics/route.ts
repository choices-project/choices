import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';
import { withAuth, createRateLimitMiddleware, combineMiddleware } from '@/lib/core/auth/middleware'
import { getQueryOptimizer, withPerformanceMonitoring } from '@/lib/core/database/optimizer'

export const dynamic = 'force-dynamic'

// Rate limiting: 60 requests per minute per IP
const rateLimitMiddleware = createRateLimitMiddleware({
  maxRequests: 60,
  windowMs: 60 * 1000
})

// Combined middleware: rate limiting + admin auth
const middleware = combineMiddleware(rateLimitMiddleware)

export const GET = withAuth(async (request: NextRequest, _context) => {
  try {
    // Apply rate limiting
    const rateLimitResult = await middleware(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, 1y

    // Use optimized analytics query with performance monitoring
    const queryOptimizer = await getQueryOptimizer()
    const getAnalyticsOptimized = withPerformanceMonitoring(
      () => queryOptimizer.getAnalytics(period),
      'analytics_query'
    )

    const analyticsData = await getAnalyticsOptimized()

    return NextResponse.json({
      ...analyticsData,
      generatedAt: new Date().toISOString(),
      performance: {
        queryOptimized: true,
        cacheEnabled: true
      }
    })

  } catch (error) {
    // narrow 'unknown' → Error
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Analytics API error:', err)
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}, { requireAdmin: true })
