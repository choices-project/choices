// Test FEC API search with correct endpoint
require('dotenv').config({ path: '.env.local' });

async function testFECSearchV2() {
  const apiKey = process.env.FEC_API_KEY;
  console.log('Testing FEC API search with correct endpoint...');
  
  try {
    // Test the exact search that the pipeline would use with the correct endpoint
    const searchName = 'George Whitesides'; // First and last name
    const state = 'California';
    const office = 'Representative';
    
    // Determine office type for FEC search
    let officeParam = '';
    if (office.toLowerCase().includes('president')) officeParam = '&office=P';
    else if (office.toLowerCase().includes('senate') || office.toLowerCase().includes('senator')) officeParam = '&office=S';
    else if (office.toLowerCase().includes('house') || office.toLowerCase().includes('representative') || office.toLowerCase().includes('assembly')) officeParam = '&office=H';
    
    // Use the dedicated search endpoint with 'q' parameter
    const searchUrl = `https://api.open.fec.gov/v1/candidates/search/?q=${encodeURIComponent(searchName)}&state=${state}${officeParam}&api_key=${apiKey}&election_year=2024&election_year=2022&election_year=2020`;
    
    console.log('Search URL:', searchUrl);
    console.log('Search parameters:', { searchName, state, office, officeParam });
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('FEC search results:');
      console.log('Results count:', data.results?.length || 0);
      
      if (data.results && data.results.length > 0) {
        console.log('First result:', data.results[0]);
        
        // Test getting campaign finance data for the found candidate
        const candidate = data.results[0];
        if (candidate.candidate_id) {
          console.log('\nTesting campaign finance data for:', candidate.candidate_id);
          
          const financeResponse = await fetch(
            `https://api.open.fec.gov/v1/candidate/${candidate.candidate_id}/totals/?api_key=${apiKey}&cycle=2024`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }
          );
          
          console.log('Finance response status:', financeResponse.status);
          if (financeResponse.ok) {
            const financeData = await financeResponse.json();
            console.log('Campaign finance data:', financeData.results?.[0]);
          } else {
            console.log('Finance request failed:', financeResponse.status);
          }
        }
      } else {
        console.log('No FEC candidates found');
      }
    } else {
      const errorText = await response.text();
      console.log('FEC search error:', errorText);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testFECSearchV2();
