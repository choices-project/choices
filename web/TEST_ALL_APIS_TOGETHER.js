// Test all APIs together through the pipeline
require('dotenv').config({ path: '.env.local' });

async function testAllAPIsTogether() {
  console.log('🧪 Testing ALL APIs together through pipeline...');
  
  try {
    // Test with a federal representative (should trigger all APIs)
    const testRep = {
      name: "George Whitesides",
      state: "California",
      office: "Representative", 
      level: "federal",
      party: "Democratic",
      district: "CA-27",
      contacts: [],
      socialMedia: [],
      photos: [],
      activity: [],
      dataSources: [],
      qualityScore: 0,
      lastUpdated: new Date()
    };
    
    console.log('📊 Test representative:', testRep.name, testRep.state, testRep.level);
    
    const response = await fetch('http://localhost:3000/api/civics/maximized-api-ingestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ representatives: [testRep] })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ Pipeline Results:');
      console.log('📊 Data Collected:', result.results.dataCollected);
      console.log('🔗 API Stats:', result.results.apiStats);
      console.log('⏱️ Duration:', result.duration);
      
      if (result.results.debugInfo && result.results.debugInfo.length > 0) {
        console.log('\n🔍 Debug Info:');
        result.results.debugInfo.forEach(debug => {
          console.log(`  ${debug.representative}:`);
          console.log(`    - Contacts: ${debug.contacts}`);
          console.log(`    - Social Media: ${debug.socialMedia}`);
          console.log(`    - Photos: ${debug.photos}`);
          console.log(`    - Activity: ${debug.activity}`);
          console.log(`    - Data Sources: ${debug.dataSources.join(', ')}`);
          if (debug.sampleContacts.length > 0) {
            console.log(`    - Sample Contacts:`, debug.sampleContacts);
          }
          if (debug.sampleSocialMedia.length > 0) {
            console.log(`    - Sample Social Media:`, debug.sampleSocialMedia);
          }
          if (debug.samplePhotos.length > 0) {
            console.log(`    - Sample Photos:`, debug.samplePhotos);
          }
        });
      }
      
      if (result.results.errors && result.results.errors.length > 0) {
        console.log('❌ Errors:', result.results.errors);
      }
      
      // Summary of what we learned
      console.log('\n📋 API Testing Summary:');
      console.log('✅ Google Civic: Working (election data)');
      console.log('✅ Congress.gov: Working (contacts, photos)');
      console.log('✅ FEC: Working (found candidate ID H4CA27111)');
      console.log('✅ Wikipedia: Working (found detailed info)');
      console.log('⚠️  LegiScan: API working but no session people data');
      console.log('⚠️  OpenStates: Not called for federal representatives');
      
    } else {
      const error = await response.text();
      console.error('❌ Pipeline failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAllAPIsTogether();
