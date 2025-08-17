#!/usr/bin/env node

/**
 * Project Status Assessment Script
 * 
 * This script helps future agents quickly assess the current state of the Choices platform.
 * Run this script to get a comprehensive overview of what's working and what needs attention.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: './web/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Choices Platform Status Assessment')
console.log('=====================================')
console.log(`Assessment Time: ${new Date().toISOString()}`)
console.log(`Assessor: AI Assistant`)
console.log('')

async function assessProjectStatus() {
  const status = {
    database: { status: 'unknown', details: [] },
    authentication: { status: 'unknown', details: [] },
    security: { status: 'unknown', details: [] },
    documentation: { status: 'unknown', details: [] },
    deployment: { status: 'unknown', details: [] },
    features: { status: 'unknown', details: [] }
  }

  try {
    // Check environment variables
    console.log('📋 Step 1: Environment Configuration')
    console.log('------------------------------------')
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase credentials')
      status.deployment.status = 'failed'
      status.deployment.details.push('Missing environment variables')
      return status
    }

    console.log('✅ Supabase credentials found')
    console.log(`📡 URL: ${supabaseUrl}`)
    console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`)

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check database connectivity
    console.log('\n📋 Step 2: Database Connectivity')
    console.log('--------------------------------')
    
    try {
      const { data, error } = await supabase
        .from('ia_users')
        .select('count')
        .limit(1)
      
      if (error) {
        console.log('❌ Database connection failed:', error.message)
        status.database.status = 'failed'
        status.database.details.push(`Connection error: ${error.message}`)
      } else {
        console.log('✅ Database connection successful')
        status.database.status = 'working'
        status.database.details.push('Connection established')
      }
    } catch (err) {
      console.log('❌ Database connection error:', err.message)
      status.database.status = 'failed'
      status.database.details.push(`Connection error: ${err.message}`)
    }

    // Check core tables
    console.log('\n📋 Step 3: Core Tables Status')
    console.log('-----------------------------')
    
    const coreTables = [
      'ia_users',
      'ia_tokens', 
      'po_polls',
      'po_votes',
      'feedback'
    ]

    for (const table of coreTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
          status.database.details.push(`${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: Accessible`)
          status.database.details.push(`${table}: OK`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
        status.database.details.push(`${table}: ${err.message}`)
      }
    }

    // Check automated polls tables
    console.log('\n📋 Step 4: Automated Polls Tables')
    console.log('--------------------------------')
    
    const automatedTables = [
      'trending_topics',
      'generated_polls',
      'data_sources',
      'poll_generation_logs',
      'quality_metrics',
      'system_configuration'
    ]

    for (const table of automatedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) {
          console.log(`⚠️  ${table}: ${error.message}`)
          status.features.details.push(`${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: Accessible`)
          status.features.details.push(`${table}: OK`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
        status.features.details.push(`${table}: ${err.message}`)
      }
    }

    // Check documentation
    console.log('\n📋 Step 5: Documentation Status')
    console.log('------------------------------')
    
    const coreDocs = [
      'DOCUMENTATION_SYSTEM.md',
      'AGENT_QUICK_REFERENCE.md',
      'AGENT_ONBOARDING.md',
      'DEVELOPMENT_BEST_PRACTICES.md',
      'PROJECT_STATUS_ASSESSMENT.md',
      'CHANGE_LOG.md',
      'DEPLOYMENT_SUCCESS_SUMMARY.md'
    ]

    for (const doc of coreDocs) {
      if (fs.existsSync(doc)) {
        console.log(`✅ ${doc}: Present`)
        status.documentation.details.push(`${doc}: OK`)
      } else {
        console.log(`❌ ${doc}: Missing`)
        status.documentation.details.push(`${doc}: Missing`)
      }
    }

    // Check feature docs
    const featureDocs = [
      'docs/AUTOMATED_POLLS_ROADMAP.md',
      'docs/AUTOMATED_TRENDING_POLLS_RESEARCH.md',
      'docs/PRIVACY_ENCRYPTION.md',
      'docs/feature-flags.md'
    ]

    for (const doc of featureDocs) {
      if (fs.existsSync(doc)) {
        console.log(`✅ ${doc}: Present`)
        status.documentation.details.push(`${doc}: OK`)
      } else {
        console.log(`⚠️  ${doc}: Missing`)
        status.documentation.details.push(`${doc}: Missing`)
      }
    }

    // Check scripts
    console.log('\n📋 Step 6: Utility Scripts')
    console.log('-------------------------')
    
    const utilityScripts = [
      'scripts/check_supabase_auth.js',
      'scripts/test-auth-flow.js',
      'scripts/test-complete-flow.js',
      'scripts/deploy-ia-tokens-and-security.js'
    ]

    for (const script of utilityScripts) {
      if (fs.existsSync(script)) {
        console.log(`✅ ${script}: Present`)
        status.deployment.details.push(`${script}: OK`)
      } else {
        console.log(`⚠️  ${script}: Missing`)
        status.deployment.details.push(`${script}: Missing`)
      }
    }

    // Determine overall status
    console.log('\n📊 Overall Assessment')
    console.log('====================')
    
    const overallStatus = determineOverallStatus(status)
    console.log(`🎯 Overall Status: ${overallStatus}`)
    
    console.log('\n📋 Component Status:')
    Object.entries(status).forEach(([component, info]) => {
      const emoji = info.status === 'working' ? '✅' : info.status === 'failed' ? '❌' : '⚠️'
      console.log(`${emoji} ${component}: ${info.status}`)
    })

    // Recommendations
    console.log('\n🎯 Recommendations')
    console.log('==================')
    
    if (status.database.status === 'failed') {
      console.log('🔧 Database Issues:')
      console.log('   - Check Supabase credentials')
      console.log('   - Verify database connection')
      console.log('   - Review deployment status')
    }

    if (status.documentation.details.some(d => d.includes('Missing'))) {
      console.log('📚 Documentation Issues:')
      console.log('   - Missing core documentation files')
      console.log('   - Review DOCUMENTATION_SYSTEM.md')
    }

    if (status.features.details.some(d => d.includes('error'))) {
      console.log('🚀 Feature Issues:')
      console.log('   - Some automated polls tables may not exist')
      console.log('   - Check DEPLOYMENT_SUCCESS_SUMMARY.md')
    }

    console.log('\n📖 Next Steps:')
    console.log('1. Read DOCUMENTATION_SYSTEM.md for navigation')
    console.log('2. Check AGENT_QUICK_REFERENCE.md for quick context')
    console.log('3. Review PROJECT_STATUS_ASSESSMENT.md for detailed status')
    console.log('4. Check CHANGE_LOG.md for recent changes')

    return status

  } catch (error) {
    console.error('❌ Assessment failed:', error.message)
    return status
  }
}

function determineOverallStatus(status) {
  const failedComponents = Object.values(status).filter(s => s.status === 'failed').length
  const workingComponents = Object.values(status).filter(s => s.status === 'working').length
  
  if (failedComponents === 0 && workingComponents > 0) {
    return '✅ EXCELLENT'
  } else if (failedComponents === 0) {
    return '⚠️  NEEDS VERIFICATION'
  } else if (failedComponents <= 2) {
    return '⚠️  NEEDS ATTENTION'
  } else {
    return '❌ CRITICAL ISSUES'
  }
}

// Run assessment
assessProjectStatus().then(status => {
  console.log('\n🎉 Assessment Complete!')
  console.log('======================')
  console.log('For detailed information, check:')
  console.log('- PROJECT_STATUS_ASSESSMENT.md')
  console.log('- DEPLOYMENT_SUCCESS_SUMMARY.md')
  console.log('- CHANGE_LOG.md')
}).catch(error => {
  console.error('❌ Assessment failed:', error)
  process.exit(1)
})
