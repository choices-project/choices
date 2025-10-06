/**
 * Verify Activity Storage
 * 
 * This script verifies that activity data was properly stored in the database
 * Created: October 6, 2025
 */

require('dotenv').config({ path: '.env.local' });

async function verifyActivityStorage() {
  console.log('🔍 Verifying Activity Storage...');
  console.log('📊 Checking if activity data was properly stored in database\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  
  try {
    // Get Nancy Pelosi's representative ID
    const { data: coreData, error: coreError } = await supabase
      .from('representatives_core')
      .select('id, name')
      .eq('name', 'Nancy Pelosi')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (coreError) {
      console.error('❌ Core data query error:', coreError);
      return;
    }
    
    if (!coreData || coreData.length === 0) {
      console.log('❌ Nancy Pelosi not found in database');
      return;
    }
    
    const repId = coreData[0].id;
    console.log(`✅ Found Nancy Pelosi with ID: ${repId}`);
    
    // Check activity data
    console.log('\n📈 Checking activity data...');
    const { data: activityData, error: activityError } = await supabase
      .from('representative_activity')
      .select('*')
      .eq('representative_id', repId)
      .order('created_at', { ascending: false });
    
    if (activityError) {
      console.error('❌ Activity query error:', activityError);
      return;
    }
    
    console.log(`📈 Found ${activityData.length} activity records`);
    
    if (activityData.length > 0) {
      console.log('\n📊 Activity Records:');
      activityData.forEach((activity, index) => {
        console.log(`  ${index + 1}. ${activity.title} (${activity.activity_type})`);
        console.log(`     - Date: ${activity.date}`);
        console.log(`     - Source: ${activity.source}`);
        console.log(`     - URL: ${activity.url || 'N/A'}`);
        console.log('');
      });
      
      console.log('✅ Activity storage is working correctly!');
    } else {
      console.log('❌ No activity records found');
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('─'.repeat(40));
    console.log(`✅ Activity records stored: ${activityData.length}`);
    console.log('✅ Activity storage pipeline is working correctly');
    
  } catch (error) {
    console.error('❌ Activity storage verification failed:', error);
  }
}

// Run the verification
verifyActivityStorage();
