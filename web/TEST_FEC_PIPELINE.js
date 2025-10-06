// Test FEC API through the pipeline
require('dotenv').config({ path: '.env.local' });

async function testFECPipeline() {
  console.log('🧪 Testing FEC API through pipeline...');
  
  try {
    // Test with a federal representative (FEC only works for federal candidates)
    const testRep = {
      name: "George Whitesides", // We know this exists in FEC
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
      
    } else {
      const error = await response.text();
      console.error('❌ Pipeline failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFECPipeline();
