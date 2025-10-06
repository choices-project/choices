/**
 * Test Pipeline Activity Direct
 * 
 * This script tests the pipeline activity extraction directly
 * Created: October 6, 2025
 */

require('dotenv').config({ path: '.env.local' });

async function testPipelineActivityDirect() {
  console.log('🔍 Testing Pipeline Activity Direct...');
  console.log('📊 Testing pipeline activity extraction directly\n');
  
  try {
    // Test with Nancy Pelosi
    const testRep = {
      name: 'Nancy Pelosi',
      state: 'California',
      office: 'House of Representatives',
      level: 'federal',
      party: 'Democratic'
    };
    
    console.log(`🧪 Testing with: ${testRep.name}`);
    console.log('─'.repeat(60));
    
    // Call the API endpoint
    console.log('📡 Calling maximized-api-ingestion endpoint...');
    const response = await fetch('http://localhost:3000/api/civics/maximized-api-ingestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ representatives: [testRep] })
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
      console.log('\n🔍 Debug Info (Pipeline Output):');
      results.results.debugInfo.forEach((info, index) => {
        console.log(`  ${index + 1}. ${info.representative}:`);
        console.log(`     - Contacts: ${info.contacts}`);
        console.log(`     - Social Media: ${info.socialMedia}`);
        console.log(`     - Photos: ${info.photos}`);
        console.log(`     - Activity: ${info.activity}`);
        console.log(`     - Data Sources: ${info.dataSources?.join(', ') || 'none'}`);
        
        if (info.sampleActivity && info.sampleActivity.length > 0) {
          console.log(`     - Sample Activity:`);
          info.sampleActivity.forEach((activity, i) => {
            console.log(`       ${i + 1}. ${activity.title} (${activity.type})`);
          });
        }
      });
    }
    
    if (results.results.dataCollected) {
      console.log('\n📊 Data Collected by API (Storage Logic):');
      console.log(`  Contacts: ${results.results.dataCollected.contacts}`);
      console.log(`  Social Media: ${results.results.dataCollected.socialMedia}`);
      console.log(`  Photos: ${results.results.dataCollected.photos}`);
      console.log(`  Activity: ${results.results.dataCollected.activity}`);
    }
    
    // Analysis
    console.log('\n📊 ANALYSIS:');
    console.log('─'.repeat(40));
    
    if (results.results.debugInfo && results.results.debugInfo[0]) {
      const debugInfo = results.results.debugInfo[0];
      console.log(`Pipeline extracted: ${debugInfo.activity} activity items`);
      console.log(`Storage logic received: ${results.results.dataCollected.activity} activity items`);
      
      if (debugInfo.activity > 0 && results.results.dataCollected.activity === 0) {
        console.log('🚨 ISSUE: Activity data is being lost between pipeline and storage logic');
        console.log('This means the enrichedRep object is not containing the activity data');
        console.log('when it reaches the storage logic in the API endpoint');
        
        console.log('\n🔍 ROOT CAUSE ANALYSIS:');
        console.log('1. Pipeline is extracting activity data correctly (9 items)');
        console.log('2. But enrichedRep.activity is undefined in API endpoint');
        console.log('3. This suggests the activity data is being lost in mergeAndValidateData method');
        console.log('4. Or the activity data is not being passed correctly to mergeAndValidateData');
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Check if activity parameter is empty in mergeAndValidateData call');
        console.log('2. Check if individual API data objects contain activity data');
        console.log('3. Check if getRecentActivity method is returning data correctly');
        console.log('4. Add debug logging to mergeAndValidateData method');
      } else if (debugInfo.activity === 0) {
        console.log('🚨 ISSUE: Activity is not being extracted by pipeline');
        console.log('This means the issue is in the data extraction phase');
      } else {
        console.log('✅ Activity extraction and storage working correctly');
      }
    }
    
  } catch (error) {
    console.error('❌ Pipeline activity direct test failed:', error);
  }
}

// Run the test
testPipelineActivityDirect();
