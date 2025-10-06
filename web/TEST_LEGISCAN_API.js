// Test LegiScan API directly
require('dotenv').config({ path: '.env.local' });

async function testLegiScanAPI() {
  const apiKey = process.env.LEGISCAN_API_KEY;
  console.log('Testing LegiScan API...');
  console.log('API Key configured:', !!apiKey);
  
  try {
    // Test LegiScan API with a state legislator
    console.log('1. Testing LegiScan session people search...');
    const response = await fetch(
      `https://api.legiscan.com/?key=${apiKey}&op=getSessionPeople&id=CA`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('LegiScan API response structure:');
      console.log('Results count:', data.sessionpeople?.length || 0);
      
      if (data.sessionpeople && data.sessionpeople.length > 0) {
        console.log('First person:', data.sessionpeople[0]);
        
        // Test getting detailed person info
        const person = data.sessionpeople[0];
        if (person.people_id) {
          console.log('2. Testing LegiScan person details...');
          const personResponse = await fetch(
            `https://api.legiscan.com/?key=${apiKey}&op=getPerson&id=${person.people_id}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }
          );
          
          if (personResponse.ok) {
            const personData = await personResponse.json();
            console.log('LegiScan person details:');
            console.log('Keys:', Object.keys(personData.person || {}));
            console.log('Sample data:', personData.person);
          } else {
            console.log('LegiScan person details request failed:', personResponse.status);
          }
        }
      } else {
        console.log('No LegiScan session people found');
      }
    } else {
      const errorText = await response.text();
      console.log('LegiScan API error:', errorText);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLegiScanAPI();
