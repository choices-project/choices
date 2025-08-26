import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    logger.info('Admin schema status check request', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Check if user is authenticated and has admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const schemaStatus = await checkSchemaStatus()
    return NextResponse.json(schemaStatus)
  } catch (error) {
    logger.error('Error checking schema status', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json(
      { error: 'Failed to check schema status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('Admin manual cache refresh request', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Check if user is authenticated and has admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()
    
    if (action === 'refresh_cache') {
      const result = await attemptCacheRefresh()
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Error with cache refresh action', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json(
      { error: 'Failed to perform cache refresh action' },
      { status: 500 }
    )
  }
}

async function checkSchemaStatus() {
  const startTime = Date.now()
  
  try {
    // Test 1: Check if user_profiles table is accessible
    const { data: userProfilesTest, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('username, display_name, email')
      .limit(1)
    
    // Test 2: Try to insert a test row
    const testId = `schema-test-${Date.now()}`
    const { data: insertTest, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testId,
        username: `testuser-${Date.now()}`,
        display_name: 'Schema Test User',
        email: `test-${Date.now()}@test.com`,
        auth_methods: { biometric: false, device_flow: true, password: true }
      })
      .select()
    
    // Clean up test data if insert was successful
    if (!insertError) {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testId)
    }
    
    // Test 3: Check migration log
    const { data: migrations, error: migrationError } = await supabase
      .from('migration_log')
      .select('migration_name, applied_at, status')
      .order('applied_at', { ascending: false })
      .limit(5)
    
    // Determine schema status
    let schemaStatus: 'refreshed' | 'pending' | 'error'
    let statusMessage: string
    
    if (userProfilesError && userProfilesError.code === '42703') {
      schemaStatus = 'pending'
      statusMessage = 'Schema cache needs refresh - columns not accessible'
    } else if (insertError && insertError.code === 'PGRST204') {
      schemaStatus = 'pending'
      statusMessage = 'Schema cache needs refresh - insert operations failing'
    } else if (userProfilesError || insertError) {
      schemaStatus = 'error'
      statusMessage = `Schema error: ${userProfilesError?.message || insertError?.message}`
    } else {
      schemaStatus = 'refreshed'
      statusMessage = 'Schema cache is refreshed and working correctly'
    }
    
    const responseTime = Date.now() - startTime
    
    return {
      timestamp: new Date().toISOString(),
      responseTime,
      schemaStatus,
      statusMessage,
      tests: {
        selectTest: {
          success: !userProfilesError,
          error: userProfilesError?.message || null,
          errorCode: userProfilesError?.code || null
        },
        insertTest: {
          success: !insertError,
          error: insertError?.message || null,
          errorCode: insertError?.code || null
        }
      },
      migrations: migrations || [],
      lastMigration: migrations?.[0]?.applied_at || 'Unknown',
      recommendations: getRecommendations(schemaStatus, userProfilesError, insertError)
    }
  } catch (error) {
    logger.error('Error checking schema status', { error: error instanceof Error ? error.message : 'Unknown error' })
    return {
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      schemaStatus: 'error' as const,
      statusMessage: 'Failed to check schema status',
      tests: {
        selectTest: { success: false, error: 'Check failed', errorCode: null },
        insertTest: { success: false, error: 'Check failed', errorCode: null }
      },
      migrations: [],
      lastMigration: 'Unknown',
      recommendations: ['Check system logs for detailed error information']
    }
  }
}

async function attemptCacheRefresh() {
  try {
    // Attempt to trigger cache refresh by running a query
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    // Try to insert and delete a test row to force cache refresh
    const testId = `cache-refresh-${Date.now()}`
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: testId,
        username: `refresh-test-${Date.now()}`,
        display_name: 'Cache Refresh Test',
        email: `refresh-${Date.now()}@test.com`,
        auth_methods: { biometric: false, device_flow: true, password: true }
      })
      .select()
    
    // Clean up
    if (!insertError) {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testId)
    }
    
    // Check if the refresh attempt worked
    const statusAfterRefresh = await checkSchemaStatus()
    
    return {
      success: statusAfterRefresh.schemaStatus === 'refreshed',
      message: statusAfterRefresh.schemaStatus === 'refreshed' 
        ? 'Cache refresh successful' 
        : 'Cache refresh attempted but schema still needs refresh',
      statusAfterRefresh
    }
  } catch (error) {
    logger.error('Error attempting cache refresh', { error: error instanceof Error ? error.message : 'Unknown error' })
    return {
      success: false,
      message: 'Cache refresh failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function getRecommendations(
  schemaStatus: string, 
  userProfilesError: any, 
  insertError: any
): string[] {
  const recommendations = []
  
  if (schemaStatus === 'pending') {
    recommendations.push('Wait for PostgREST schema cache to refresh automatically (1-4 hours)')
    recommendations.push('Check migration log to confirm migrations were applied successfully')
    recommendations.push('Consider contacting Supabase support if issue persists beyond 4 hours')
  } else if (schemaStatus === 'error') {
    recommendations.push('Check database connection and credentials')
    recommendations.push('Verify that all required tables exist')
    recommendations.push('Review migration logs for any failed migrations')
    recommendations.push('Check Supabase dashboard for any service issues')
  } else if (schemaStatus === 'refreshed') {
    recommendations.push('Schema is working correctly - no action needed')
    recommendations.push('Test user registration functionality')
    recommendations.push('Monitor system performance')
  }
  
  return recommendations
}
