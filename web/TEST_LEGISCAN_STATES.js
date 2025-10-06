// Test LegiScan API with different state formats
require('dotenv').config({ path: '.env.local' });

async function testLegiScanStates() {
  const apiKey = process.env.LEGISCAN_API_KEY;
  console.log('Testing LegiScan API with different state formats...');
  
  try {
    // Test different state ID formats
    const stateFormats = [
      'CA',      // Abbreviation
      'California', // Full name
      'california', // Lowercase
      'CA-2024', // With year
      'california-2024' // Full name with year
    ];
    
    for (const stateFormat of stateFormats) {
      console.log(`\n=== Testing state format: "${stateFormat}" ===`);
      
      const response = await fetch(
        `https://api.legiscan.com/?key=${apiKey}&op=getSessionPeople&id=${stateFormat}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Results count:', data.sessionpeople?.length || 0);
        
        if (data.sessionpeople && data.sessionpeople.length > 0) {
          console.log('First person:', data.sessionpeople[0]);
          break; // Stop if we find results
        }
      } else {
        const errorText = await response.text();
        console.log('Error:', errorText);
      }
    }
    
    // Test with a different state that might have active sessions
    console.log('\n=== Testing with Texas ===');
    const texasResponse = await fetch(
      `https://api.legiscan.com/?key=${apiKey}&op=getSessionPeople&id=TX`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Texas response status:', texasResponse.status);
    if (texasResponse.ok) {
      const texasData = await texasResponse.json();
      console.log('Texas results count:', texasData.sessionpeople?.length || 0);
      if (texasData.sessionpeople && texasData.sessionpeople.length > 0) {
        console.log('First Texas person:', texasData.sessionpeople[0]);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLegiScanStates();
