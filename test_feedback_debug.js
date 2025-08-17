#!/usr/bin/env node

// Debug script to test feedback table structure
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: './web/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFeedbackTable() {
  console.log('🔍 Testing feedback table structure...')
  
  try {
    // Test 1: Check if table exists
    console.log('\n1. Checking if feedback table exists...')
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
    
    // Test 3: Try to insert test data
    console.log('\n3. Testing data insertion...')
    const testData = {
      type: 'feature',
      title: 'Test Feedback',
      description: 'This is a test feedback submission',
      sentiment: 'positive',
      user_journey: { page: '/', action: 'test' },
      status: 'open',
      priority: 'medium'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('feedback')
      .insert([testData])
      .select()
    
    if (insertError) {
      console.error('❌ Insert error:', insertError)
      return
    }
    
    console.log('✅ Test data inserted successfully!')
    console.log('📊 Inserted data:', insertData)
    
    // Test 4: Try to fetch the data
    console.log('\n4. Testing data retrieval...')
    const { data: fetchData, error: fetchError } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (fetchError) {
      console.error('❌ Fetch error:', fetchError)
      return
    }
    
    console.log('✅ Data retrieved successfully!')
    console.log('📊 Retrieved data:', fetchData)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testFeedbackTable()
