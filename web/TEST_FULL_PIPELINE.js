/**
 * Test Full Pipeline
 * 
 * This script tests the complete pipeline and immediately checks database
 * Created: October 6, 2025
 */

require('dotenv').config({ path: '.env.local' });

async function testFullPipeline() {
  console.log('🔍 Testing Full Pipeline...');
  console.log('📊 Testing complete flow and immediate database verification\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  
  // Test with Nancy Pelosi
  const representatives = [
    {
      name: 'Nancy Pelosi',
      state: 'California',
      office: 'House of Representatives',
      level: 'federal',
      party: 'Democratic'
    }
  ];
  
  console.log(`🧪 Testing with: ${representatives[0].name}`);
  console.log('─'.repeat(60));
  
  try {
    // Call the API endpoint
    console.log('📡 Calling maximized-api-ingestion endpoint...');
    const response = await fetch('http://localhost:3001/api/civics/maximized-api-ingestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ representatives })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const results = await response.json();
    
    console.log('\n✅ API Response Received:');
    console.log(`📊 Processed: ${results.results.processed}`);
    console.log(`✅ Successful: ${results.results.successful}`);
    console.log(`❌ Failed: ${results.results.failed}`);
    
    if (results.results.dataCollected) {
      console.log('\n📊 Data Collected by API:');
      console.log(`  Contacts: ${results.results.dataCollected.contacts}`);
      console.log(`  Social Media: ${results.results.dataCollected.socialMedia}`);
      console.log(`  Photos: ${results.results.dataCollected.photos}`);
      console.log(`  Activity: ${results.results.dataCollected.activity}`);
    }
    
    // Wait a moment for database operations to complete
    console.log('\n⏳ Waiting for database operations to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the most recent Nancy Pelosi record
    console.log('\n🔍 Getting most recent Nancy Pelosi record...');
    const { data: coreData, error: coreError } = await supabase
      .from('representatives_core')
      .select('id, name, created_at')
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
    console.log(`📅 Created at: ${coreData[0].created_at}`);
    
    // Check contacts for this specific representative
    console.log('\n📞 Checking contacts for this representative...');
    const { data: contactsData, error: contactsError } = await supabase
      .from('representative_contacts')
      .select('*')
      .eq('representative_id', repId);
    
    if (contactsError) {
      console.error('❌ Contacts query error:', contactsError);
    } else {
      console.log(`📞 Found ${contactsData?.length || 0} contacts for this representative`);
      if (contactsData && contactsData.length > 0) {
        contactsData.forEach((contact, index) => {
          console.log(`  ${index + 1}. ${contact.type}: ${contact.value} (${contact.source})`);
        });
      }
    }
    
    // Check photos for this specific representative
    console.log('\n📸 Checking photos for this representative...');
    const { data: photosData, error: photosError } = await supabase
      .from('representative_photos')
      .select('*')
      .eq('representative_id', repId);
    
    if (photosError) {
      console.error('❌ Photos query error:', photosError);
    } else {
      console.log(`📸 Found ${photosData?.length || 0} photos for this representative`);
      if (photosData && photosData.length > 0) {
        photosData.forEach((photo, index) => {
          console.log(`  ${index + 1}. ${photo.url} (${photo.source})`);
        });
      }
    }
    
    // Check activity for this specific representative
    console.log('\n📈 Checking activity for this representative...');
    const { data: activityData, error: activityError } = await supabase
      .from('representative_activity')
      .select('*')
      .eq('representative_id', repId);
    
    if (activityError) {
      console.error('❌ Activity query error:', activityError);
    } else {
      console.log(`📈 Found ${activityData?.length || 0} activity records for this representative`);
      if (activityData && activityData.length > 0) {
        activityData.forEach((activity, index) => {
          console.log(`  ${index + 1}. ${activity.type}: ${activity.title}`);
        });
      }
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`  API Reported Contacts: ${results.results.dataCollected?.contacts || 0}`);
    console.log(`  Database Contacts: ${contactsData?.length || 0}`);
    console.log(`  API Reported Photos: ${results.results.dataCollected?.photos || 0}`);
    console.log(`  Database Photos: ${photosData?.length || 0}`);
    console.log(`  API Reported Activity: ${results.results.dataCollected?.activity || 0}`);
    console.log(`  Database Activity: ${activityData?.length || 0}`);
    
    if ((results.results.dataCollected?.contacts || 0) > 0 && (contactsData?.length || 0) === 0) {
      console.log('\n🚨 ISSUE: API reports contacts but database has none - data not being stored');
    } else if ((results.results.dataCollected?.contacts || 0) === (contactsData?.length || 0)) {
      console.log('\n✅ SUCCESS: Contact data matches between API and database');
    }
    
  } catch (error) {
    console.error('❌ Full pipeline test failed:', error);
  }
}

// Run the test
testFullPipeline();
