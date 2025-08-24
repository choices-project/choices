import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting: 60 requests per minute per IP
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = await limiter.check(60, ip)
    
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
        { message: 'Authentication service not available' },
        { status: 500 }
      )
    }

    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('trust_tier')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.trust_tier !== 'T3') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, 1y

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Fetch analytics data
    const [
      { count: totalUsers },
      { count: totalPolls },
      { count: totalVotes },
      { data: userGrowth },
      { data: pollActivity },
      { data: voteActivity }
    ] = await Promise.all([
      // Total users
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true }),
      
      // Total polls
      supabase
        .from('polls')
        .select('*', { count: 'exact', head: true }),
      
      // Total votes
      supabase
        .from('votes')
        .select('*', { count: 'exact', head: true }),
      
      // User growth over time
      supabase
        .from('user_profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true }),
      
      // Poll activity over time
      supabase
        .from('polls')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true }),
      
      // Vote activity over time
      supabase
        .from('votes')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })
    ])

    // Process time series data
    const processTimeSeries = (data: any[], dateField: string) => {
      const grouped = data.reduce((acc: any, item: any) => {
        const date = new Date(item[dateField]).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})

      return Object.entries(grouped).map(([date, count]) => ({
        date,
        count: count as number
      }))
    }

    // Calculate additional metrics
    const activeUsers = userGrowth?.length || 0
    const newPolls = pollActivity?.length || 0
    const newVotes = voteActivity?.length || 0

    // Calculate engagement rate (users who voted in the period)
    const { count: engagedUsers } = await supabase
      .from('votes')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    const engagementRate = totalUsers ? ((engagedUsers || 0) / totalUsers * 100).toFixed(1) : '0'

    return NextResponse.json({
      period,
      summary: {
        totalUsers: totalUsers || 0,
        totalPolls: totalPolls || 0,
        totalVotes: totalVotes || 0,
        activeUsers,
        newPolls,
        newVotes,
        engagementRate: `${engagementRate}%`
      },
      trends: {
        userGrowth: processTimeSeries(userGrowth || [], 'created_at'),
        pollActivity: processTimeSeries(pollActivity || [], 'created_at'),
        voteActivity: processTimeSeries(voteActivity || [], 'created_at')
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
