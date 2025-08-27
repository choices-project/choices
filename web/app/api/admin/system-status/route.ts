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
    logger.info('Admin system status request', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Check if user is authenticated and has admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get system status data
    const systemStatus = await getSystemStatus()

    // Create feedback for critical issues
    await createSystemFeedback(systemStatus)

    return NextResponse.json(systemStatus)
  } catch (error) {
    logger.error('Error fetching system status', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to fetch system status' },
      { status: 500 }
    )
  }
}

async function createSystemFeedback(systemStatus: any) {
  try {
    const issues = []
    
    // Check for schema cache issues
    if (systemStatus.database.schemaStatus === 'pending') {
      issues.push({
        type: 'system',
        title: 'Schema Cache Pending Refresh',
        description: `Database schema cache needs refresh. Last migration: ${systemStatus.database.lastMigration}. This may affect user registration functionality.`,
        priority: 'high',
        tags: ['database', 'schema', 'cache', 'registration']
      })
    }
    
    // Check for connection issues
    if (systemStatus.database.connectionStatus === 'error') {
      issues.push({
        type: 'system',
        title: 'Database Connection Error',
        description: `Database connection is failing. Error: ${systemStatus.database.schemaError || 'Unknown error'}`,
        priority: 'critical',
        tags: ['database', 'connection', 'critical']
      })
    }
    
    // Check for system health issues
    if (systemStatus.health.systemHealth === 'critical') {
      issues.push({
        type: 'system',
        title: 'System Health Critical',
        description: `System health is critical. Health score: ${systemStatus.health.healthScore}. Issues: ${systemStatus.health.healthFactors.join(', ')}`,
        priority: 'critical',
        tags: ['system', 'health', 'critical']
      })
    } else if (systemStatus.health.systemHealth === 'warning') {
      issues.push({
        type: 'system',
        title: 'System Health Warning',
        description: `System health is degraded. Health score: ${systemStatus.health.healthScore}. Issues: ${systemStatus.health.healthFactors.join(', ')}`,
        priority: 'medium',
        tags: ['system', 'health', 'warning']
      })
    }
    
    // Create feedback entries for each issue
    for (const issue of issues) {
      await supabase
        .from('feedback')
        .insert({
          type: issue.type,
          title: issue.title,
          description: issue.description,
          priority: issue.priority,
          tags: issue.tags,
          status: 'open',
          sentiment: 'negative',
          metadata: {
            source: 'admin-dashboard',
            systemStatus: systemStatus,
            timestamp: new Date().toISOString()
          }
        })
    }
    
    if (issues.length > 0) {
      logger.info('Created system feedback for issues', { 
        issueCount: issues.length,
        issues: issues.map(i => i.title)
      })
    }
  } catch (error) {
    logger.error('Error creating system feedback', error instanceof Error ? error : new Error('Unknown error'))
  }
}

async function getSystemStatus() {
  const startTime = Date.now()
  
  try {
    // Get database status
    const dbStatus = await getDatabaseStatus()
    
    // Get user statistics
    const userStats = await getUserStats()
    
    // Get poll statistics
    const pollStats = await getPollStats()
    
    // Get system health metrics
    const healthMetrics = await getHealthMetrics()
    
    const responseTime = Date.now() - startTime
    
    return {
      timestamp: new Date().toISOString(),
      responseTime,
      database: dbStatus,
      users: userStats,
      polls: pollStats,
      health: healthMetrics
    }
  } catch (error) {
    logger.error('Error getting system status', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

async function getDatabaseStatus() {
  try {
    // Test database connection and schema status
    const { data: userProfilesTest, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('username, display_name, email')
      .limit(1)
    
    // Check if schema cache is refreshed
    const schemaStatus = userProfilesError && userProfilesError.code === '42703' 
      ? 'pending' 
      : 'refreshed'
    
    // Get migration log
    const { data: migrations, error: migrationError } = await supabase
      .from('migration_log')
      .select('migration_name, applied_at, status')
      .order('applied_at', { ascending: false })
      .limit(5)
    
    // Get table count
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    // Test connection with a simple query
    const { data: connectionTest, error: connectionError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    
    return {
      schemaStatus,
      connectionStatus: connectionError ? 'error' : 'connected',
      tableCount: tables?.length || 0,
      lastMigration: migrations?.[0]?.applied_at || 'Unknown',
      cacheRefreshTime: new Date().toISOString(),
      migrationCount: migrations?.length || 0,
      recentMigrations: migrations?.slice(0, 3) || [],
      schemaError: userProfilesError?.message || null
    }
  } catch (error) {
    logger.error('Error getting database status', error instanceof Error ? error : new Error('Unknown error'))
    return {
      schemaStatus: 'error',
      connectionStatus: 'error',
      tableCount: 0,
      lastMigration: 'Unknown',
      cacheRefreshTime: new Date().toISOString(),
      migrationCount: 0,
      recentMigrations: [],
      schemaError: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function getUserStats() {
  try {
    // Get total user count
    const { count: totalUsers, error: userCountError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
    
    // Get recent registrations
    const { data: recentUsers, error: recentUsersError } = await supabase
      .from('user_profiles')
      .select('username, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Get admin users count
    const { count: adminUsers, error: adminError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', true)
    
    return {
      totalUsers: totalUsers || 0,
      recentUsers: recentUsers || [],
      adminUsers: adminUsers || 0,
      lastRegistration: recentUsers?.[0]?.created_at || null
    }
  } catch (error) {
    logger.error('Error getting user stats', error instanceof Error ? error : new Error('Unknown error'))
    return {
      totalUsers: 0,
      recentUsers: [],
      adminUsers: 0,
      lastRegistration: null
    }
  }
}

async function getPollStats() {
  try {
    // Get total poll count
    const { count: totalPolls, error: pollCountError } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true })
    
    // Get active polls
    const { count: activePolls, error: activeError } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    
    // Get total votes
    const { count: totalVotes, error: voteError } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
    
    // Get recent polls
    const { data: recentPolls, error: recentError } = await supabase
      .from('polls')
      .select('title, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5)
    
    return {
      totalPolls: totalPolls || 0,
      activePolls: activePolls || 0,
      totalVotes: totalVotes || 0,
      recentPolls: recentPolls || []
    }
  } catch (error) {
    logger.error('Error getting poll stats', error instanceof Error ? error : new Error('Unknown error'))
    return {
      totalPolls: 0,
      activePolls: 0,
      totalVotes: 0,
      recentPolls: []
    }
  }
}

async function getHealthMetrics() {
  try {
    // Calculate system health based on various factors
    const healthFactors = []
    let healthScore = 100
    
    // Check database connection
    const { data: dbTest, error: dbError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    
    if (dbError) {
      healthFactors.push('Database connection issues')
      healthScore -= 30
    }
    
    // Check schema status
    const { data: schemaTest, error: schemaError } = await supabase
      .from('user_profiles')
      .select('username')
      .limit(1)
    
    if (schemaError && schemaError.code === '42703') {
      healthFactors.push('Schema cache pending refresh')
      healthScore -= 20
    }
    
    // Determine overall health
    let systemHealth: 'excellent' | 'good' | 'warning' | 'critical'
    if (healthScore >= 90) systemHealth = 'excellent'
    else if (healthScore >= 70) systemHealth = 'good'
    else if (healthScore >= 50) systemHealth = 'warning'
    else systemHealth = 'critical'
    
    return {
      systemHealth,
      healthScore,
      healthFactors,
      lastCheck: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Error getting health metrics', error instanceof Error ? error : new Error('Unknown error'))
    return {
      systemHealth: 'critical' as const,
      healthScore: 0,
      healthFactors: ['System check failed'],
      lastCheck: new Date().toISOString()
    }
  }
}
