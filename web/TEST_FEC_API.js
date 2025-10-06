// Test FEC API directly
require('dotenv').config({ path: '.env.local' });

async function testFECAPI() {
  const apiKey = process.env.FEC_API_KEY;
  console.log('Testing FEC API...');
  console.log('API Key configured:', !!apiKey);
  
  try {
    // Test FEC API with a federal candidate
    console.log('1. Testing FEC candidate search...');
    const response = await fetch(
      `https://api.open.fec.gov/v1/candidates/?api_key=${apiKey}&name=George Whitesides&per_page=5`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('FEC API response structure:');
      console.log('Results count:', data.results?.length || 0);
      
      if (data.results && data.results.length > 0) {
        console.log('First candidate:', data.results[0]);
        
        // Test getting detailed candidate info
        const candidate = data.results[0];
        if (candidate.candidate_id) {
          console.log('2. Testing FEC candidate details...');
          const detailResponse = await fetch(
            `https://api.open.fec.gov/v1/candidate/${candidate.candidate_id}/?api_key=${apiKey}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }
          );
          
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            console.log('FEC candidate details:');
            console.log('Keys:', Object.keys(detailData.results || {}));
            console.log('Sample data:', detailData.results);
          } else {
            console.log('FEC detail request failed:', detailResponse.status);
          }
        }
      } else {
        console.log('No FEC candidates found');
      }
    } else {
      const errorText = await response.text();
      console.log('FEC API error:', errorText);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testFECAPI();
