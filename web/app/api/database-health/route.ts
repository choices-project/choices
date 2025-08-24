import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting: 30 requests per minute per IP
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = await limiter.check(30, ip)
    
    if (!success) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    if (!supabase) {
      return NextResponse.json(
        { message: 'Database service not available' },
        { status: 500 }
      )
    }

    // Get current user session for admin check
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Check if user is admin (if authenticated)
    let isAdmin = false
    if (!authError && user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('trust_tier')
        .eq('user_id', user.id)
        .single()
      
      isAdmin = profile?.trust_tier === 'T3'
    }

    const startTime = Date.now()

    // Test database connectivity and performance
    const healthChecks = await Promise.allSettled([
      // Basic connectivity test
      supabase.from('user_profiles').select('count', { count: 'exact', head: true }),
      
      // Table access test
      supabase.from('polls').select('id').limit(1),
      
      // Performance test (simple query)
      supabase.from('votes').select('id').limit(1),
      
      // Complex query test
      supabase
        .from('user_profiles')
        .select(`
          user_id,
          username,
          trust_tier,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    const endTime = Date.now()
    const responseTime = endTime - startTime

    // Analyze health check results
    const results = healthChecks.map((result, index) => {
      const testNames = ['Connectivity', 'Table Access', 'Performance', 'Complex Query']
      const testName = testNames[index] || `Test ${index + 1}`
      
      if (result.status === 'fulfilled') {
        return {
          test: testName,
          status: 'healthy',
          responseTime: 'N/A', // Individual response times not available
          error: null
        }
      } else {
        return {
          test: testName,
          status: 'unhealthy',
          responseTime: 'N/A',
          error: result.reason?.message || 'Unknown error'
        }
      }
    })

    // Determine overall health
    const healthyTests = results.filter(r => r.status === 'healthy').length
    const totalTests = results.length
    const healthPercentage = (healthyTests / totalTests) * 100

    const overallStatus = healthPercentage >= 80 ? 'healthy' : 
                         healthPercentage >= 50 ? 'degraded' : 'unhealthy'

    // Get basic system metrics
    const [userCount, pollCount, voteCount] = await Promise.allSettled([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('polls').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true })
    ])

    const metrics = {
      users: userCount.status === 'fulfilled' ? userCount.value.count || 0 : 'unknown',
      polls: pollCount.status === 'fulfilled' ? pollCount.value.count || 0 : 'unknown',
      votes: voteCount.status === 'fulfilled' ? voteCount.value.count || 0 : 'unknown'
    }

    // Check for recent errors (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: recentErrors } = await supabase
      .from('error_logs')
      .select('id, error_type, message, created_at')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(10)

    const response = {
      status: overallStatus,
      healthPercentage: Math.round(healthPercentage),
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      tests: results,
      metrics,
      recentErrors: recentErrors || [],
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
      }
    }

    // Add admin-only information if user is admin
    if (isAdmin) {
      response.adminInfo = {
        databaseSize: 'N/A', // Would need special permissions
        connectionPool: 'N/A', // Would need special permissions
        lastBackup: 'N/A', // Would need special permissions
        maintenanceMode: false
      }
    }

    // Return appropriate status code based on health
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    console.error('Database health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      healthPercentage: 0,
      responseTime: 'N/A',
      timestamp: new Date().toISOString(),
      tests: [],
      metrics: { users: 'unknown', polls: 'unknown', votes: 'unknown' },
      recentErrors: [],
      error: 'Health check failed',
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
      }
    }, { status: 503 })
  }
}

export async function POST(_request: NextRequest) {
  try {
    const { action } = await _request.json();

    switch (action) {
      case 'clear_metrics':
        queryMonitor.clearMetrics();
        return NextResponse.json({
          status: 'success',
          message: 'Performance metrics cleared',
          timestamp: new Date().toISOString()
        });

      case 'get_slow_queries':
        const slowQueries = queryMonitor.getSlowQueries();
        return NextResponse.json({
          status: 'success',
          slowQueries,
          count: slowQueries.length,
          timestamp: new Date().toISOString()
        });

      case 'get_performance_report':
        const report = {
          averageQueryTime: queryMonitor.getAverageQueryTime(),
          errorRate: queryMonitor.getErrorRate(),
          slowQueries: queryMonitor.getSlowQueries(),
          totalQueries: queryMonitor.getSlowQueries(0).length
        };
        
        return NextResponse.json({
          status: 'success',
          report,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          status: 'error',
          message: 'Invalid action',
          validActions: ['clear_metrics', 'get_slow_queries', 'get_performance_report']
        }, { status: 400 });
    }

  } catch (error) {
    devLog('Database health action error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
