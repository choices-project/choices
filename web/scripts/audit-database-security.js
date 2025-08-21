#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function auditDatabaseSecurity() {
  try {
    console.log('🔍 Database Security Audit')
    console.log('==========================')
    
    // Step 1: Check current schema
    console.log('\n📋 Step 1: Checking current database schema...')
    
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          table_name,
          table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    })
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError)
      return
    }
    
    console.log('✅ Found tables:')
    if (tables && Array.isArray(tables)) {
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`)
      })
    } else {
      console.log('   No tables found or unexpected response format')
    }
    
    // Step 2: Check RLS policies
    console.log('\n🔒 Step 2: Checking Row Level Security (RLS) policies...')
    
    const { data: rlsPolicies, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
      `
    })
    
    if (rlsError) {
      console.error('❌ Error checking RLS policies:', rlsError)
    } else {
      console.log(`✅ Found ${rlsPolicies?.length || 0} RLS policies:`)
      if (rlsPolicies && Array.isArray(rlsPolicies)) {
        rlsPolicies.forEach(policy => {
          console.log(`   - ${policy.tablename}.${policy.policyname} (${policy.cmd})`)
        })
      }
    }
    
    // Step 3: Check RLS status on tables
    console.log('\n🔐 Step 3: Checking RLS status on tables...')
    
    const { data: rlsStatus, error: rlsStatusError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `
    })
    
    if (rlsStatusError) {
      console.error('❌ Error checking RLS status:', rlsStatusError)
    } else {
      console.log('✅ RLS status:')
      if (rlsStatus && Array.isArray(rlsStatus)) {
        rlsStatus.forEach(table => {
          const status = table.rowsecurity ? '🔒 ENABLED' : '❌ DISABLED'
          console.log(`   - ${table.tablename}: ${status}`)
        })
      }
    }
    
    // Step 4: Check for missing RLS policies
    console.log('\n⚠️  Step 4: Identifying tables without RLS policies...')
    
    const tablesWithoutPolicies = (rlsStatus && Array.isArray(rlsStatus)) ? rlsStatus.filter(table => {
      const hasPolicy = (rlsPolicies && Array.isArray(rlsPolicies)) ? rlsPolicies.some(policy => policy.tablename === table.tablename) : false
      return !hasPolicy && table.rowsecurity
    }) : []
    
    if (tablesWithoutPolicies.length > 0) {
      console.log('⚠️  Tables with RLS enabled but no policies:')
      tablesWithoutPolicies.forEach(table => {
        console.log(`   - ${table.tablename}`)
      })
    } else {
      console.log('✅ All tables with RLS have policies')
    }
    
    // Step 5: Check for security vulnerabilities
    console.log('\n🚨 Step 5: Checking for security vulnerabilities...')
    
    // Check for tables without RLS
    const tablesWithoutRLS = (rlsStatus && Array.isArray(rlsStatus)) ? rlsStatus.filter(table => !table.rowsecurity) : []
    if (tablesWithoutRLS.length > 0) {
      console.log('🚨 Tables without RLS (security risk):')
      tablesWithoutRLS.forEach(table => {
        console.log(`   - ${table.tablename}`)
      })
    } else {
      console.log('✅ All tables have RLS enabled')
    }
    
    // Step 6: Check for proper foreign key constraints
    console.log('\n🔗 Step 6: Checking foreign key constraints...')
    
    const { data: foreignKeys, error: fkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name;
      `
    })
    
    if (fkError) {
      console.error('❌ Error checking foreign keys:', fkError)
    } else {
      console.log(`✅ Found ${foreignKeys?.length || 0} foreign key constraints:`)
      if (foreignKeys && Array.isArray(foreignKeys)) {
        foreignKeys.forEach(fk => {
          console.log(`   - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`)
        })
      }
    }
    
    // Step 7: Generate recommendations
    console.log('\n📋 Step 7: Security Recommendations')
    console.log('==================================')
    
    if (tablesWithoutRLS.length > 0) {
      console.log('🔴 CRITICAL: Enable RLS on all tables')
      console.log('   Run: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;')
    }
    
    if (tablesWithoutPolicies.length > 0) {
      console.log('🟡 WARNING: Add RLS policies to tables')
      console.log('   Tables need proper access control policies')
    }
    
    console.log('✅ Database security audit completed!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the audit
auditDatabaseSecurity()
