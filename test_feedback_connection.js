#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testing Supabase connection and feedback table...')
  
  try {
    // Test 1: Basic connection
    console.log('\n1. Testing basic connection...')
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'feedback')
    
    if (tableError) {
      console.error('❌ Error checking table:', tableError)
      return
    }
    
    if (tables.length === 0) {
      console.error('❌ Feedback table does not exist!')
      return
    }
    
    console.log('✅ Feedback table exists')
    
    // Test 2: Check table structure
    console.log('\n2. Checking table structure...')
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'feedback')
      .order('ordinal_position')
    
    if (columnError) {
      console.error('❌ Error checking columns:', columnError)
      return
    }
    
    console.log('📋 Table columns:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Test 3: Try to insert test data directly
    console.log('\n3. Testing direct data insertion...')
    const testData = {
      type: 'feature',
      title: 'Direct Test Feedback',
      description: 'This is a direct test feedback submission',
      sentiment: 'positive',
      user_journey: { page: '/', action: 'direct_test' },
      status: 'open',
      priority: 'medium'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('feedback')
      .insert([testData])
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting data:', insertError)
      return
    }
    
    console.log('✅ Data inserted successfully!')
    console.log('📝 Inserted data:', insertData[0])
    
    // Test 4: Query the data back
    console.log('\n4. Testing data retrieval...')
    const { data: queryData, error: queryError } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (queryError) {
      console.error('❌ Error querying data:', queryError)
      return
    }
    
    console.log('✅ Data retrieved successfully!')
    console.log('📊 Total feedback entries:', queryData.length)
    queryData.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title} (${item.type}, ${item.sentiment})`)
    })
    
    console.log('\n🎉 All tests passed! Feedback system is working correctly.')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testConnection()
