#!/usr/bin/env node

/**
 * Comprehensive Security Audit Script
 * This script audits all security measures in the application
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

async function securityAudit() {
  console.log('🔒 Starting Comprehensive Security Audit...\n')

  const auditResults = {
    database: { passed: 0, failed: 0, issues: [] },
    api: { passed: 0, failed: 0, issues: [] },
    authentication: { passed: 0, failed: 0, issues: [] },
    authorization: { passed: 0, failed: 0, issues: [] },
    dataProtection: { passed: 0, failed: 0, issues: [] }
  }

  // Database Security Audit
  console.log('📊 Database Security Audit...')
  
  // Check RLS policies
  try {
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .eq('schemaname', 'public')

    if (error) throw error

    const tablesWithRLS = ['user_profiles', 'polls', 'votes', 'webauthn_credentials', 'error_logs']
    const tablesWithoutPolicies = tablesWithRLS.filter(table => 
      !policies.some(p => p.tablename === table)
    )

    if (tablesWithoutPolicies.length > 0) {
      auditResults.database.failed++
      auditResults.database.issues.push(`Tables without RLS policies: ${tablesWithoutPolicies.join(', ')}`)
      console.log(`   ❌ Tables without RLS policies: ${tablesWithoutPolicies.join(', ')}`)
    } else {
      auditResults.database.passed++
      console.log(`   ✅ All ${tablesWithRLS.length} tables have RLS policies`)
    }
  } catch (error) {
    auditResults.database.failed++
    auditResults.database.issues.push(`Failed to check RLS policies: ${error.message}`)
    console.log(`   ❌ Failed to check RLS policies: ${error.message}`)
  }

  // Check for sensitive data exposure
  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type')
      .eq('table_schema', 'public')
      .like('column_name', '%password%')

    if (error) throw error

    if (columns.length > 0) {
      auditResults.database.failed++
      auditResults.database.issues.push(`Potential password columns found: ${columns.map(c => `${c.table_name}.${c.column_name}`).join(', ')}`)
      console.log(`   ⚠️  Potential password columns found: ${columns.map(c => `${c.table_name}.${c.column_name}`).join(', ')}`)
    } else {
      auditResults.database.passed++
      console.log(`   ✅ No password columns found in database`)
    }
  } catch (error) {
    auditResults.database.failed++
    auditResults.database.issues.push(`Failed to check for password columns: ${error.message}`)
    console.log(`   ❌ Failed to check for password columns: ${error.message}`)
  }

  // Check indexes for performance
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
      'idx_error_logs_created_at'
    ]

    const missingIndexes = expectedIndexes.filter(index => 
      !indexes.some(i => i.indexname === index)
    )

    if (missingIndexes.length > 0) {
      auditResults.database.failed++
      auditResults.database.issues.push(`Missing performance indexes: ${missingIndexes.join(', ')}`)
      console.log(`   ⚠️  Missing performance indexes: ${missingIndexes.join(', ')}`)
    } else {
      auditResults.database.passed++
      console.log(`   ✅ All ${expectedIndexes.length} expected indexes exist`)
    }
  } catch (error) {
    auditResults.database.failed++
    auditResults.database.issues.push(`Failed to check indexes: ${error.message}`)
    console.log(`   ❌ Failed to check indexes: ${error.message}`)
  }

  // API Security Audit
  console.log('\n🔌 API Security Audit...')

  // Check API routes exist
  const apiRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/webauthn/register',
    '/api/auth/webauthn/authenticate',
    '/api/admin/users',
    '/api/analytics',
    '/api/database-health'
  ]

  for (const route of apiRoutes) {
    const routePath = path.join(process.cwd(), 'web/app', route, 'route.ts')
    if (fs.existsSync(routePath)) {
      auditResults.api.passed++
      console.log(`   ✅ API route exists: ${route}`)
    } else {
      auditResults.api.failed++
      auditResults.api.issues.push(`Missing API route: ${route}`)
      console.log(`   ❌ Missing API route: ${route}`)
    }
  }

  // Check for rate limiting in API routes
  const rateLimitPattern = /rateLimit|limiter|rate.*limit/i
  for (const route of apiRoutes) {
    const routePath = path.join(process.cwd(), 'web/app', route, 'route.ts')
    if (fs.existsSync(routePath)) {
      const content = fs.readFileSync(routePath, 'utf8')
      if (rateLimitPattern.test(content)) {
        auditResults.api.passed++
        console.log(`   ✅ Rate limiting found in: ${route}`)
      } else {
        auditResults.api.failed++
        auditResults.api.issues.push(`No rate limiting found in: ${route}`)
        console.log(`   ⚠️  No rate limiting found in: ${route}`)
      }
    }
  }

  // Authentication Security Audit
  console.log('\n🔐 Authentication Security Audit...')

  // Check auth middleware exists
  const authMiddlewarePath = path.join(process.cwd(), 'web/lib/auth-middleware.ts')
  if (fs.existsSync(authMiddlewarePath)) {
    auditResults.authentication.passed++
    console.log(`   ✅ Auth middleware exists`)
  } else {
    auditResults.authentication.failed++
    auditResults.authentication.issues.push('Auth middleware not found')
    console.log(`   ❌ Auth middleware not found`)
  }

  // Check for proper error handling in auth
  try {
    const { data: authConfig, error } = await supabase.auth.admin.listUsers()
    if (error) throw error

    // Check if admin users exist
    const adminUsers = authConfig.users.filter(user => 
      user.app_metadata?.provider === 'email' && user.email_confirmed_at
    )

    if (adminUsers.length === 0) {
      auditResults.authentication.failed++
      auditResults.authentication.issues.push('No confirmed admin users found')
      console.log(`   ⚠️  No confirmed admin users found`)
    } else {
      auditResults.authentication.passed++
      console.log(`   ✅ ${adminUsers.length} confirmed admin users found`)
    }
  } catch (error) {
    auditResults.authentication.failed++
    auditResults.authentication.issues.push(`Failed to check admin users: ${error.message}`)
    console.log(`   ❌ Failed to check admin users: ${error.message}`)
  }

  // Authorization Security Audit
  console.log('\n🛡️ Authorization Security Audit...')

  // Check trust tier system
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('trust_tier')
      .not('trust_tier', 'is', null)

    if (error) throw error

    const trustTiers = [...new Set(profiles.map(p => p.trust_tier))]
    const validTiers = ['T1', 'T2', 'T3']

    const invalidTiers = trustTiers.filter(tier => !validTiers.includes(tier))
    if (invalidTiers.length > 0) {
      auditResults.authorization.failed++
      auditResults.authorization.issues.push(`Invalid trust tiers found: ${invalidTiers.join(', ')}`)
      console.log(`   ❌ Invalid trust tiers found: ${invalidTiers.join(', ')}`)
    } else {
      auditResults.authorization.passed++
      console.log(`   ✅ All trust tiers are valid: ${trustTiers.join(', ')}`)
    }
  } catch (error) {
    auditResults.authorization.failed++
    auditResults.authorization.issues.push(`Failed to check trust tiers: ${error.message}`)
    console.log(`   ❌ Failed to check trust tiers: ${error.message}`)
  }

  // Data Protection Audit
  console.log('\n🔒 Data Protection Audit...')

  // Check for audit logging
  try {
    const { data: auditLogs, error } = await supabase
      .from('error_logs')
      .select('error_type')
      .eq('error_type', 'AUDIT')
      .limit(1)

    if (error) throw error

    if (auditLogs.length > 0) {
      auditResults.dataProtection.passed++
      console.log(`   ✅ Audit logging is active`)
    } else {
      auditResults.dataProtection.failed++
      auditResults.dataProtection.issues.push('No audit logs found')
      console.log(`   ⚠️  No audit logs found`)
    }
  } catch (error) {
    auditResults.dataProtection.failed++
    auditResults.dataProtection.issues.push(`Failed to check audit logs: ${error.message}`)
    console.log(`   ❌ Failed to check audit logs: ${error.message}`)
  }

  // Check for data encryption
  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type')
      .eq('table_schema', 'public')
      .like('data_type', '%encrypted%')

    if (error) throw error

    if (columns.length > 0) {
      auditResults.dataProtection.passed++
      console.log(`   ✅ Encrypted columns found: ${columns.map(c => `${c.table_name}.${c.column_name}`).join(', ')}`)
    } else {
      auditResults.dataProtection.failed++
      auditResults.dataProtection.issues.push('No encrypted columns found')
      console.log(`   ⚠️  No encrypted columns found`)
    }
  } catch (error) {
    auditResults.dataProtection.failed++
    auditResults.dataProtection.issues.push(`Failed to check encryption: ${error.message}`)
    console.log(`   ❌ Failed to check encryption: ${error.message}`)
  }

  // Generate Summary Report
  console.log('\n📋 Security Audit Summary')
  console.log('========================')

  const categories = Object.keys(auditResults)
  let totalPassed = 0
  let totalFailed = 0

  for (const category of categories) {
    const result = auditResults[category]
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

  // Generate recommendations
  console.log(`\n💡 Recommendations:`)
  
  if (auditResults.database.failed > 0) {
    console.log(`   - Review and fix database security issues`)
  }
  
  if (auditResults.api.failed > 0) {
    console.log(`   - Implement missing API security measures`)
  }
  
  if (auditResults.authentication.failed > 0) {
    console.log(`   - Strengthen authentication mechanisms`)
  }
  
  if (auditResults.authorization.failed > 0) {
    console.log(`   - Review authorization policies`)
  }
  
  if (auditResults.dataProtection.failed > 0) {
    console.log(`   - Enhance data protection measures`)
  }

  if (totalFailed === 0) {
    console.log(`\n🎉 All security checks passed!`)
  } else {
    console.log(`\n⚠️  ${totalFailed} security issues found. Please address them.`)
  }

  // Save detailed report
  const reportPath = path.join(process.cwd(), 'security-audit-report.json')
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPassed,
      totalFailed,
      successRate: parseFloat(successRate)
    },
    details: auditResults
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)

  return totalFailed === 0
}

// Run the audit
securityAudit().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('❌ Security audit failed:', error)
  process.exit(1)
})
