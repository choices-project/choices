require('dotenv').config({ path: '.env.local' });

async function testLegiScanSearch() {
  console.log('Testing LegiScan search approach...');
  
  const apiKey = process.env.LEGISCAN_API_KEY;
  if (!apiKey) {
    console.log('❌ LegiScan API key not configured');
    return;
  }
  
  console.log('API Key configured:', !!apiKey);
  
  try {
    // Test search for Anthony Rendon in California (using state abbreviation)
    const searchUrl = `https://api.legiscan.com/?key=${apiKey}&op=getSearch&state=CA&query=Anthony Rendon`;
    console.log('Search URL:', searchUrl);
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Search results:', JSON.stringify(data, null, 2));
      
      if (data.search && data.search.length > 0) {
        console.log('Found search results:', data.search.length);
        
        // Look for people in the search results
        const peopleResults = data.search.filter(result => 
          result.people_id && result.people_id > 0
        );
        
        console.log('People results:', peopleResults.length);
        
        if (peopleResults.length > 0) {
          console.log('First person result:', peopleResults[0]);
        }
      } else {
        console.log('No search results found');
      }
    } else {
      console.log('Search request failed');
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testLegiScanSearch();
