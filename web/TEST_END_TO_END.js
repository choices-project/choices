/**
 * End-to-End Test
 * 
 * This script tests the complete pipeline from API call to database storage
 * Created: October 6, 2025
 */

require('dotenv').config({ path: '.env.local' });

async function testEndToEnd() {
  console.log('🔍 Testing End-to-End Pipeline...');
  console.log('📊 Testing complete flow from API call to database storage\n');
  
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
    
    if (results.results.debugInfo && results.results.debugInfo.length > 0) {
      console.log('\n🔍 Debug Info:');
      results.results.debugInfo.forEach((info, index) => {
        console.log(`  ${index + 1}. ${info.representative}:`);
        console.log(`     - Contacts: ${info.contacts}`);
        console.log(`     - Social Media: ${info.socialMedia}`);
        console.log(`     - Photos: ${info.photos}`);
        console.log(`     - Activity: ${info.activity}`);
        console.log(`     - Data Sources: ${info.dataSources?.join(', ') || 'none'}`);
        
        if (info.sampleContacts && info.sampleContacts.length > 0) {
          console.log(`     - Sample Contacts:`);
          info.sampleContacts.forEach((contact, i) => {
            console.log(`       ${i + 1}. ${contact.type}: ${contact.value}`);
          });
        }
        
        if (info.samplePhotos && info.samplePhotos.length > 0) {
          console.log(`     - Sample Photos:`);
          info.samplePhotos.forEach((photo, i) => {
            console.log(`       ${i + 1}. ${photo.url}`);
          });
        }
      });
    }
    
    if (results.results.apiStats) {
      console.log('\n📊 API Stats:');
      Object.entries(results.results.apiStats).forEach(([api, stats]) => {
        console.log(`  ${api}: Called ${stats.called}, Successful ${stats.successful}`);
      });
    }
    
    if (results.results.dataCollected) {
      console.log('\n📊 Data Collected:');
      console.log(`  Contacts: ${results.results.dataCollected.contacts}`);
      console.log(`  Social Media: ${results.results.dataCollected.socialMedia}`);
      console.log(`  Photos: ${results.results.dataCollected.photos}`);
      console.log(`  Activity: ${results.results.dataCollected.activity}`);
    }
    
    if (results.results.errors && results.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Now verify the data was stored in the database
    console.log('\n🔍 Verifying Database Storage...');
    await verifyDatabaseStorage();
    
  } catch (error) {
    console.error('❌ End-to-end test failed:', error);
  }
}

async function verifyDatabaseStorage() {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  
  try {
    // Check core data
    const { data: coreData, error: coreError } = await supabase
      .from('representatives_core')
      .select('*')
      .eq('name', 'Nancy Pelosi');
    
    if (coreError) {
      console.error('❌ Core data query error:', coreError);
      return;
    }
    
    console.log(`📊 Core Data: ${coreData?.length || 0} records found`);
    if (coreData && coreData.length > 0) {
      const rep = coreData[0];
      console.log(`  - ID: ${rep.id}`);
      console.log(`  - Name: ${rep.name}`);
      console.log(`  - Party: ${rep.party}`);
      console.log(`  - Data Sources: ${rep.data_sources?.join(', ') || 'none'}`);
      console.log(`  - Primary Phone: ${rep.primary_phone || 'none'}`);
      console.log(`  - Primary Website: ${rep.primary_website || 'none'}`);
    }
    
    // Check contacts
    const { data: contactsData, error: contactsError } = await supabase
      .from('representative_contacts')
      .select('*')
      .eq('representative_id', coreData?.[0]?.id);
    
    if (contactsError) {
      console.error('❌ Contacts query error:', contactsError);
    } else {
      console.log(`📞 Contacts: ${contactsData?.length || 0} records found`);
      if (contactsData && contactsData.length > 0) {
        contactsData.forEach((contact, index) => {
          console.log(`  ${index + 1}. ${contact.type}: ${contact.value} (${contact.source})`);
        });
      }
    }
    
    // Check photos
    const { data: photosData, error: photosError } = await supabase
      .from('representative_photos')
      .select('*')
      .eq('representative_id', coreData?.[0]?.id);
    
    if (photosError) {
      console.error('❌ Photos query error:', photosError);
    } else {
      console.log(`📸 Photos: ${photosData?.length || 0} records found`);
      if (photosData && photosData.length > 0) {
        photosData.forEach((photo, index) => {
          console.log(`  ${index + 1}. ${photo.url} (${photo.source})`);
        });
      }
    }
    
    // Check activity
    const { data: activityData, error: activityError } = await supabase
      .from('representative_activity')
      .select('*')
      .eq('representative_id', coreData?.[0]?.id);
    
    if (activityError) {
      console.error('❌ Activity query error:', activityError);
    } else {
      console.log(`📈 Activity: ${activityData?.length || 0} records found`);
      if (activityData && activityData.length > 0) {
        activityData.forEach((activity, index) => {
          console.log(`  ${index + 1}. ${activity.type}: ${activity.title}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Database verification error:', error);
  }
}

// Run the test
testEndToEnd();
