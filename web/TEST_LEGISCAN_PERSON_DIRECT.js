// Test LegiScan API getPerson operation directly
require('dotenv').config({ path: '.env.local' });

async function testLegiScanPersonDirect() {
  const apiKey = process.env.LEGISCAN_API_KEY;
  console.log('Testing LegiScan API getPerson operation directly...');
  
  try {
    // Test with a known people_id from the documentation example
    const testPeopleId = 4718; // From the documentation example
    
    console.log(`Testing getPerson with people_id: ${testPeopleId}`);
    const personResponse = await fetch(
      `https://api.legiscan.com/?key=${apiKey}&op=getPerson&id=${testPeopleId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Person response status:', personResponse.status);
    if (personResponse.ok) {
      const personData = await personResponse.json();
      console.log('Person data:', personData.person);
    } else {
      console.log('Person request failed:', personResponse.status);
    }
    
    // Test with another people_id
    const testPeopleId2 = 3709; // From the documentation example
    console.log(`\nTesting getPerson with people_id: ${testPeopleId2}`);
    const personResponse2 = await fetch(
      `https://api.legiscan.com/?key=${apiKey}&op=getPerson&id=${testPeopleId2}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Person 2 response status:', personResponse2.status);
    if (personResponse2.ok) {
      const personData2 = await personResponse2.json();
      console.log('Person 2 data:', personData2.person);
    } else {
      console.log('Person 2 request failed:', personResponse2.status);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLegiScanPersonDirect();
