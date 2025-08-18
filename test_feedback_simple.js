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

async function testFeedbackTable() {
  console.log('🔍 Testing feedback table directly...')
  
  try {
    // Test 1: Try to query the feedback table
    console.log('\n1. Testing feedback table query...')
    const { data: feedback, error: queryError } = await supabase
      .from('feedback')
      .select('*')
      .limit(1)
    
    if (queryError) {
      console.error('❌ Error querying feedback table:', queryError)
      return
    }
    
    console.log('✅ Feedback table is accessible!')
    console.log('📊 Current feedback count:', feedback.length)
    
    // Test 2: Try to insert test data
    console.log('\n2. Testing data insertion...')
    const testData = {
      type: 'feature',
      title: 'Simple Test Feedback',
      description: 'This is a simple test feedback submission',
      sentiment: 'positive',
      user_journey: { page: '/', action: 'simple_test' },
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
    console.log('📝 Inserted feedback ID:', insertData[0].id)
    
    // Test 3: Query all feedback
    console.log('\n3. Querying all feedback...')
    const { data: allFeedback, error: allError } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (allError) {
      console.error('❌ Error querying all feedback:', allError)
      return
    }
    
    console.log('✅ All feedback retrieved successfully!')
    console.log('📊 Total feedback entries:', allFeedback.length)
    
    allFeedback.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title} (${item.type}, ${item.sentiment}) - ${item.created_at}`)
    })
    
    console.log('\n🎉 Feedback system is working correctly!')
    console.log('\n🔗 You can now:')
    console.log('1. Visit https://choices-platform.vercel.app to see the feedback widget')
    console.log('2. Visit https://choices-platform.vercel.app/admin/feedback to view feedback')
    console.log('3. Submit feedback through the widget and see it appear in the admin panel')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testFeedbackTable()
