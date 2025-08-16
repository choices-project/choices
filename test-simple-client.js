#!/usr/bin/env node

// Test with different client configuration
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function testSimpleClient() {
  console.log('🔧 Testing with simple client configuration...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
  }

  // Create a simple client without extra configuration
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('✅ Simple client created');

    // Test 1: Try a direct query without schema cache
    console.log('\n🔍 Test 1: Direct query...');
    
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ Direct query failed:', error.message);
      } else {
        console.log('✅ Direct query successful!');
        console.log('Data:', data);
      }
    } catch (err) {
      console.log('❌ Direct query error:', err.message);
    }

    // Test 2: Try to insert data
    console.log('\n🧪 Test 2: Insert test data...');
    
    try {
      const testData = {
        event_type: 'vote',
        poll_id: 'test-simple-' + Date.now(),
        metadata: { test: true, simple: true }
      };

      const { data: insertData, error: insertError } = await supabase
        .from('analytics_events')
        .insert(testData)
        .select();

      if (insertError) {
        console.log('❌ Insert failed:', insertError.message);
      } else {
        console.log('✅ Insert successful!');
        console.log('Inserted:', insertData);
        
        // Clean up
        if (insertData && insertData[0]?.id) {
          await supabase
            .from('analytics_events')
            .delete()
            .eq('id', insertData[0].id);
          console.log('✅ Test data cleaned up');
        }
      }
    } catch (err) {
      console.log('❌ Insert error:', err.message);
    }

    console.log('\n🎉 Simple client test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleClient().catch(console.error);
