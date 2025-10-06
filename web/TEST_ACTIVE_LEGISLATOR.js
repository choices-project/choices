require('dotenv').config({ path: '.env.local' });

async function testActiveLegislator() {
  console.log('🧪 Testing with active state legislator...');
  
  // Use Anthony Portantino who we know is in the current session
  const testRep = {
    name: 'Anthony Portantino',
    state: 'California',
    office: 'State Senator',
    level: 'state',
    party: 'Democratic'
  };
  
  console.log('📊 Test representative:', testRep.name, testRep.state, testRep.level);
  
  try {
    const response = await fetch('http://localhost:3000/api/civics/maximized-api-ingestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        representatives: [testRep]
      })
    });
    
    if (!response.ok) {
      console.log('❌ Pipeline failed:', await response.text());
      return;
    }
    
    const result = await response.json();
    
    console.log('\n✅ Pipeline Results:');
    console.log('📊 Data Collected:', {
      contacts: result.dataCollected?.contacts || 0,
      socialMedia: result.dataCollected?.socialMedia || 0,
      photos: result.dataCollected?.photos || 0,
      activity: result.dataCollected?.activity || 0,
      committees: result.dataCollected?.committees || 0,
      bills: result.dataCollected?.bills || 0,
      campaignFinance: result.dataCollected?.campaignFinance || 0
    });
    
    console.log('🔗 API Stats:', result.apiStats);
    console.log('⏱️ Duration:', result.duration, 'seconds');
    
    if (result.debugInfo && result.debugInfo.length > 0) {
      console.log('\n🔍 Debug Info:');
      result.debugInfo.forEach((info) => {
        console.log(`  ${info.name}:`);
        console.log(`    - Contacts: ${info.contacts || 0}`);
        console.log(`    - Social Media: ${info.socialMedia || 0}`);
        console.log(`    - Photos: ${info.photos || 0}`);
        console.log(`    - Activity: ${info.activity || 0}`);
        console.log(`    - Data Sources: ${info.dataSources?.join(', ') || 'none'}`);
        if (info.sampleContacts && info.sampleContacts.length > 0) {
          console.log(`    - Sample Contacts:`, JSON.stringify(info.sampleContacts.slice(0, 2), null, 2));
        }
        if (info.samplePhotos && info.samplePhotos.length > 0) {
          console.log(`    - Sample Photos:`, JSON.stringify(info.samplePhotos.slice(0, 2), null, 2));
        }
      });
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testActiveLegislator();
