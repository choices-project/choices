#!/usr/bin/env node

/**
 * Performance Testing Script
 * This script tests database performance and optimization features
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function performanceTest() {
  console.log('🚀 Starting Performance Testing...\n')

  const testResults = {
    queryPerformance: { passed: 0, failed: 0, issues: [] },
    connectionPool: { passed: 0, failed: 0, issues: [] },
    caching: { passed: 0, failed: 0, issues: [] },
    optimization: { passed: 0, failed: 0, issues: [] }
  }

  // Query Performance Tests
  console.log('📊 Query Performance Tests...')
  
  // Test basic query performance
  try {
    const startTime = Date.now()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, username, trust_tier')
      .limit(100)
    
    const duration = Date.now() - startTime
    
    if (error) throw error
    
    if (duration < 100) {
      testResults.queryPerformance.passed++
      console.log(`   ✅ Basic query performance: ${duration}ms (excellent)`)
    } else if (duration < 500) {
      testResults.queryPerformance.passed++
      console.log(`   ✅ Basic query performance: ${duration}ms (good)`)
    } else {
      testResults.queryPerformance.failed++
      testResults.queryPerformance.issues.push(`Slow basic query: ${duration}ms`)
      console.log(`   ⚠️  Basic query performance: ${duration}ms (slow)`)
    }
  } catch (error) {
    testResults.queryPerformance.failed++
    testResults.queryPerformance.issues.push(`Query failed: ${error.message}`)
    console.log(`   ❌ Basic query failed: ${error.message}`)
  }

  // Test complex query performance
  try {
    const startTime = Date.now()
    const { data, error } = await supabase
      .from('polls')
      .select(`
        *,
        votes(count),
        user_profiles(username, trust_tier)
      `)
      .order('created_at', { ascending: false })
      .limit(20)
    
    const duration = Date.now() - startTime
    
    if (error) throw error
    
    if (duration < 200) {
      testResults.queryPerformance.passed++
      console.log(`   ✅ Complex query performance: ${duration}ms (excellent)`)
    } else if (duration < 1000) {
      testResults.queryPerformance.passed++
      console.log(`   ✅ Complex query performance: ${duration}ms (good)`)
    } else {
      testResults.queryPerformance.failed++
      testResults.queryPerformance.issues.push(`Slow complex query: ${duration}ms`)
      console.log(`   ⚠️  Complex query performance: ${duration}ms (slow)`)
    }
  } catch (error) {
    testResults.queryPerformance.failed++
    testResults.queryPerformance.issues.push(`Complex query failed: ${error.message}`)
    console.log(`   ❌ Complex query failed: ${error.message}`)
  }

  // Test RLS query performance
  try {
    const startTime = Date.now()
    const { data, error } = await supabase
      .from('votes')
      .select(`
        *,
        polls(title, privacy_level),
        user_profiles(username)
      `)
      .order('created_at', { ascending: false })
      .limit(50)
    
    const duration = Date.now() - startTime
    
    if (error) throw error
    
    if (duration < 300) {
      testResults.queryPerformance.passed++
      console.log(`   ✅ RLS query performance: ${duration}ms (excellent)`)
    } else if (duration < 1500) {
      testResults.queryPerformance.passed++
      console.log(`   ✅ RLS query performance: ${duration}ms (good)`)
    } else {
      testResults.queryPerformance.failed++
      testResults.queryPerformance.issues.push(`Slow RLS query: ${duration}ms`)
      console.log(`   ⚠️  RLS query performance: ${duration}ms (slow)`)
    }
  } catch (error) {
    testResults.queryPerformance.failed++
    testResults.queryPerformance.issues.push(`RLS query failed: ${error.message}`)
    console.log(`   ❌ RLS query failed: ${error.message}`)
  }

  // Connection Pool Tests
  console.log('\n🔌 Connection Pool Tests...')
  
  // Test concurrent connections
  try {
    const concurrentQueries = Array.from({ length: 10 }, (_, i) => 
      supabase
        .from('user_profiles')
        .select('user_id')
        .limit(1)
        .then(result => ({ id: i, success: !result.error }))
        .catch(error => ({ id: i, success: false, error: error.message }))
    )
    
    const startTime = Date.now()
    const results = await Promise.all(concurrentQueries)
    const duration = Date.now() - startTime
    
    const successfulQueries = results.filter(r => r.success).length
    
    if (successfulQueries === 10) {
      testResults.connectionPool.passed++
      console.log(`   ✅ Concurrent connections: ${successfulQueries}/10 successful in ${duration}ms`)
    } else {
      testResults.connectionPool.failed++
      testResults.connectionPool.issues.push(`Concurrent connection test failed: ${successfulQueries}/10 successful`)
      console.log(`   ❌ Concurrent connections: ${successfulQueries}/10 successful in ${duration}ms`)
    }
  } catch (error) {
    testResults.connectionPool.failed++
    testResults.connectionPool.issues.push(`Concurrent connection test failed: ${error.message}`)
    console.log(`   ❌ Concurrent connection test failed: ${error.message}`)
  }

  // Test connection pool under load
  try {
    const loadQueries = Array.from({ length: 50 }, (_, i) => 
      supabase
        .from('polls')
        .select('id, title')
        .limit(5)
        .then(result => ({ id: i, success: !result.error, duration: Date.now() }))
        .catch(error => ({ id: i, success: false, error: error.message }))
    )
    
    const startTime = Date.now()
    const results = await Promise.all(loadQueries)
    const totalDuration = Date.now() - startTime
    
    const successfulQueries = results.filter(r => r.success).length
    const avgDuration = totalDuration / results.length
    
    if (successfulQueries >= 45 && avgDuration < 1000) {
      testResults.connectionPool.passed++
      console.log(`   ✅ Load test: ${successfulQueries}/50 successful, avg ${avgDuration.toFixed(0)}ms`)
    } else {
      testResults.connectionPool.failed++
      testResults.connectionPool.issues.push(`Load test failed: ${successfulQueries}/50 successful, avg ${avgDuration.toFixed(0)}ms`)
      console.log(`   ⚠️  Load test: ${successfulQueries}/50 successful, avg ${avgDuration.toFixed(0)}ms`)
    }
  } catch (error) {
    testResults.connectionPool.failed++
    testResults.connectionPool.issues.push(`Load test failed: ${error.message}`)
    console.log(`   ❌ Load test failed: ${error.message}`)
  }

  // Caching Tests
  console.log('\n💾 Caching Tests...')
  
  // Test cache table functionality
  try {
    const testKey = `perf_test_${Date.now()}`
    const testValue = JSON.stringify({ test: 'data', timestamp: Date.now() })
    
    // Test cache set
    const { error: setError } = await supabase
      .from('cache')
      .upsert({
        key: testKey,
        value: testValue,
        expires_at: new Date(Date.now() + 60000).toISOString() // 1 minute
      })
    
    if (setError) throw setError
    
    // Test cache get
    const { data: cachedData, error: getError } = await supabase
      .from('cache')
      .select('value')
      .eq('key', testKey)
      .single()
    
    if (getError) throw getError
    
    if (cachedData && cachedData.value === testValue) {
      testResults.caching.passed++
      console.log(`   ✅ Cache functionality: Set and retrieve successful`)
    } else {
      testResults.caching.failed++
      testResults.caching.issues.push('Cache set/retrieve failed')
      console.log(`   ❌ Cache functionality: Set and retrieve failed`)
    }
    
    // Clean up test cache entry
    await supabase.from('cache').delete().eq('key', testKey)
    
  } catch (error) {
    testResults.caching.failed++
    testResults.caching.issues.push(`Cache test failed: ${error.message}`)
    console.log(`   ❌ Cache test failed: ${error.message}`)
  }

  // Test cache performance
  try {
    const cacheKeys = Array.from({ length: 10 }, (_, i) => `perf_cache_${i}`)
    const cacheValues = cacheKeys.map(key => JSON.stringify({ key, data: 'test', timestamp: Date.now() }))
    
    // Set multiple cache entries
    const setPromises = cacheKeys.map((key, i) => 
      supabase
        .from('cache')
        .upsert({
          key,
          value: cacheValues[i],
          expires_at: new Date(Date.now() + 60000).toISOString()
        })
    )
    
    const startTime = Date.now()
    await Promise.all(setPromises)
    const setDuration = Date.now() - startTime
    
    // Get multiple cache entries
    const getPromises = cacheKeys.map(key =>
      supabase
        .from('cache')
        .select('value')
        .eq('key', key)
        .single()
    )
    
    const getStartTime = Date.now()
    const getResults = await Promise.all(getPromises)
    const getDuration = Date.now() - getStartTime
    
    const successfulGets = getResults.filter(r => !r.error).length
    
    if (successfulGets === 10 && getDuration < 500) {
      testResults.caching.passed++
      console.log(`   ✅ Cache performance: ${successfulGets}/10 retrieved in ${getDuration}ms`)
    } else {
      testResults.caching.failed++
      testResults.caching.issues.push(`Cache performance test failed: ${successfulGets}/10 retrieved in ${getDuration}ms`)
      console.log(`   ⚠️  Cache performance: ${successfulGets}/10 retrieved in ${getDuration}ms`)
    }
    
    // Clean up test cache entries
    await supabase.from('cache').delete().in('key', cacheKeys)
    
  } catch (error) {
    testResults.caching.failed++
    testResults.caching.issues.push(`Cache performance test failed: ${error.message}`)
    console.log(`   ❌ Cache performance test failed: ${error.message}`)
  }

  // Optimization Tests
  console.log('\n⚡ Optimization Tests...')
  
  // Test index usage
  try {
    const { data: indexes, error } = await supabase
      .from('pg_indexes')
      .select('indexname, tablename')
      .eq('schemaname', 'public')
      .like('indexname', 'idx_%')
    
    if (error) throw error
    
    const expectedIndexes = [
      'idx_user_profiles_user_id',
      'idx_user_profiles_trust_tier',
      'idx_polls_user_id',
      'idx_polls_privacy_level',
      'idx_polls_created_at',
      'idx_votes_user_id',
      'idx_votes_poll_id',
      'idx_votes_created_at',
      'idx_webauthn_credentials_user_id',
      'idx_error_logs_created_at',
      'idx_cache_expires_at',
      'idx_cache_updated_at'
    ]
    
    const existingIndexes = indexes.map(i => i.indexname)
    const missingIndexes = expectedIndexes.filter(index => !existingIndexes.includes(index))
    
    if (missingIndexes.length === 0) {
      testResults.optimization.passed++
      console.log(`   ✅ Database indexes: All ${expectedIndexes.length} expected indexes exist`)
    } else {
      testResults.optimization.failed++
      testResults.optimization.issues.push(`Missing indexes: ${missingIndexes.join(', ')}`)
      console.log(`   ❌ Database indexes: Missing ${missingIndexes.length} indexes`)
    }
  } catch (error) {
    testResults.optimization.failed++
    testResults.optimization.issues.push(`Index check failed: ${error.message}`)
    console.log(`   ❌ Index check failed: ${error.message}`)
  }

  // Test query optimization
  try {
    const startTime = Date.now()
    
    // Test optimized query with joins
    const { data, error } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        privacy_level,
        created_at,
        user_profiles!inner(username, trust_tier),
        votes(count)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    const duration = Date.now() - startTime
    
    if (error) throw error
    
    if (duration < 200) {
      testResults.optimization.passed++
      console.log(`   ✅ Query optimization: Complex join in ${duration}ms (excellent)`)
    } else if (duration < 800) {
      testResults.optimization.passed++
      console.log(`   ✅ Query optimization: Complex join in ${duration}ms (good)`)
    } else {
      testResults.optimization.failed++
      testResults.optimization.issues.push(`Slow optimized query: ${duration}ms`)
      console.log(`   ⚠️  Query optimization: Complex join in ${duration}ms (slow)`)
    }
  } catch (error) {
    testResults.optimization.failed++
    testResults.optimization.issues.push(`Optimized query failed: ${error.message}`)
    console.log(`   ❌ Optimized query failed: ${error.message}`)
  }

  // Generate Performance Report
  console.log('\n📋 Performance Test Summary')
  console.log('==========================')

  const categories = Object.keys(testResults)
  let totalPassed = 0
  let totalFailed = 0

  for (const category of categories) {
    const result = testResults[category]
    totalPassed += result.passed
    totalFailed += result.failed

    console.log(`\n${category.toUpperCase()}:`)
    console.log(`   ✅ Passed: ${result.passed}`)
    console.log(`   ❌ Failed: ${result.failed}`)
    
    if (result.issues.length > 0) {
      console.log(`   📝 Issues:`)
      result.issues.forEach(issue => console.log(`      - ${issue}`))
    }
  }

  const totalTests = totalPassed + totalFailed
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0'

  console.log(`\n📊 Overall Results:`)
  console.log(`   ✅ Total Passed: ${totalPassed}`)
  console.log(`   ❌ Total Failed: ${totalFailed}`)
  console.log(`   📈 Success Rate: ${successRate}%`)

  // Performance recommendations
  console.log(`\n💡 Performance Recommendations:`)
  
  if (testResults.queryPerformance.failed > 0) {
    console.log(`   - Review slow queries and add indexes`)
    console.log(`   - Consider query optimization`)
  }
  
  if (testResults.connectionPool.failed > 0) {
    console.log(`   - Adjust connection pool settings`)
    console.log(`   - Monitor connection usage`)
  }
  
  if (testResults.caching.failed > 0) {
    console.log(`   - Verify cache table setup`)
    console.log(`   - Check cache performance`)
  }
  
  if (testResults.optimization.failed > 0) {
    console.log(`   - Add missing database indexes`)
    console.log(`   - Optimize query patterns`)
  }

  if (totalFailed === 0) {
    console.log(`\n🎉 All performance tests passed!`)
  } else {
    console.log(`\n⚠️  ${totalFailed} performance issues found. Please address them.`)
  }

  // Save detailed report
  const reportPath = path.join(process.cwd(), 'performance-test-report.json')
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPassed,
      totalFailed,
      successRate: parseFloat(successRate)
    },
    details: testResults
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)

  return totalFailed === 0
}

// Run the performance tests
performanceTest().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('❌ Performance test failed:', error)
  process.exit(1)
})

