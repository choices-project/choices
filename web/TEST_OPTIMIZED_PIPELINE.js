// Test the optimized pipeline with minimal API calls
require('dotenv').config({ path: '.env.local' });

async function testOptimizedPipeline() {
  console.log('🧪 Testing OPTIMIZED pipeline with minimal API usage...');
  
  try {
    // Use a representative likely to have data from multiple sources
    const testRep = {
      name: "George Whitesides", // We know this exists in Congress.gov
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
    
    console.log('📊 Test representative:', testRep.name, testRep.state);
    
    // Call the actual pipeline endpoint (not individual APIs)
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
      
      if (result.results.errors && result.results.errors.length > 0) {
        console.log('❌ Errors:', result.results.errors);
      }
      
      // Check database to see what was actually stored
      console.log('\n🔍 Checking database for stored data...');
      const dbResponse = await fetch('http://localhost:3000/api/civics/check-supabase-status');
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        console.log('📊 Database counts:', dbData.status.tableCounts);
      }
      
    } else {
      const error = await response.text();
      console.error('❌ Pipeline failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOptimizedPipeline();
