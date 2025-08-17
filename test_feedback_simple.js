#!/usr/bin/env node

// Simple test script for feedback table
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
  console.log('🔍 Testing feedback table directly...')
  
  try {
    // Test 1: Try to insert test data
    console.log('\n1. Testing data insertion...')
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
      console.error('Error details:', JSON.stringify(insertError, null, 2))
      return
    }
    
    console.log('✅ Test data inserted successfully!')
    console.log('📊 Inserted data:', insertData)
    
    // Test 2: Try to fetch the data
    console.log('\n2. Testing data retrieval...')
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
    
    // Test 3: Check if the feedback widget API works
    console.log('\n3. Testing feedback widget API...')
    const response = await fetch('http://localhost:3000/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'bug',
        title: 'API Test Bug',
        description: 'Testing the feedback API from script',
        sentiment: 'negative',
        userJourney: { page: '/test', action: 'api_test' }
      })
    })
    
    const apiResult = await response.json()
    console.log('📊 API Response:', apiResult)
    
    if (response.ok) {
      console.log('✅ Feedback API working!')
    } else {
      console.log('❌ Feedback API failed')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testFeedbackTable()
