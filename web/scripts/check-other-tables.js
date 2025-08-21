#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkOtherTables() {
  try {
    console.log('🔍 Checking other tables that might cause user_id issues...')
    
    // Check if there are any other tables that might have triggers or constraints
    const tableNames = [
      'user_profiles',
      'biometric_credentials', 
      'webauthn_challenges',
      'ia_refresh_tokens',
      'ia_tokens',
      'po_polls',
      'po_votes'
    ]
    
    for (const tableName of tableNames) {
      console.log(`\n🔍 Checking table: ${tableName}`)
      
      try {
        const { data: sample, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (sampleError) {
          console.log(`   ❌ Table ${tableName} error: ${sampleError.message}`)
        } else {
          console.log(`   ✅ Table ${tableName} accessible`)
          if (sample && sample.length > 0) {
            console.log(`   📋 Sample columns: ${Object.keys(sample[0]).join(', ')}`)
          }
        }
      } catch (error) {
        console.log(`   ❌ Table ${tableName} not accessible: ${error.message}`)
      }
    }
    
    // Try to identify if there's a trigger on ia_users that's trying to insert into another table
    console.log('\n🔧 Attempting to disable all triggers temporarily...')
    
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Disable all triggers on ia_users temporarily
        ALTER TABLE ia_users DISABLE TRIGGER ALL;
      `
    })
    
    if (disableError) {
      console.log('⚠️  Could not disable triggers:', disableError.message)
    } else {
      console.log('✅ All triggers on ia_users disabled')
      
      // Now try to insert
      console.log('\n🧪 Testing insert with triggers disabled...')
      
      const { data: testInsert, error: insertError } = await supabase
        .from('ia_users')
        .insert({
          stable_id: 'test_' + Date.now(),
          email: 'test@example.com',
          verification_tier: 'T0',
          is_active: true
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ Insert still failing with triggers disabled:', insertError)
      } else {
        console.log('✅ Insert successful with triggers disabled!')
        console.log('   Test user created:', testInsert.id)
        
        // Clean up
        await supabase
          .from('ia_users')
          .delete()
          .eq('id', testInsert.id)
        
        console.log('   Test user cleaned up')
      }
      
      // Re-enable triggers
      const { error: enableError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Re-enable all triggers on ia_users
          ALTER TABLE ia_users ENABLE TRIGGER ALL;
        `
      })
      
      if (enableError) {
        console.log('⚠️  Could not re-enable triggers:', enableError.message)
      } else {
        console.log('✅ All triggers on ia_users re-enabled')
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
checkOtherTables()
