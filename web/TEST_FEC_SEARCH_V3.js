// Test FEC API search with different approaches
require('dotenv').config({ path: '.env.local' });

async function testFECSearchV3() {
  const apiKey = process.env.FEC_API_KEY;
  console.log('Testing FEC API search with different approaches...');
  
  try {
    const searchName = 'George Whitesides';
    
    // Test 1: Basic search with just name (no state filter)
    console.log('\n=== Test 1: Basic name search ===');
    const basicUrl = `https://api.open.fec.gov/v1/candidates/?q=${encodeURIComponent(searchName)}&api_key=${apiKey}`;
    console.log('URL:', basicUrl);
    
    const basicResponse = await fetch(basicUrl);
    console.log('Status:', basicResponse.status);
    if (basicResponse.ok) {
      const basicData = await basicResponse.json();
      console.log('Results count:', basicData.results?.length || 0);
      if (basicData.results && basicData.results.length > 0) {
        console.log('First result:', basicData.results[0]);
      }
    }
    
    // Test 2: Search with state abbreviation
    console.log('\n=== Test 2: Search with state abbreviation ===');
    const stateUrl = `https://api.open.fec.gov/v1/candidates/?q=${encodeURIComponent(searchName)}&state=CA&api_key=${apiKey}`;
    console.log('URL:', stateUrl);
    
    const stateResponse = await fetch(stateUrl);
    console.log('Status:', stateResponse.status);
    if (stateResponse.ok) {
      const stateData = await stateResponse.json();
      console.log('Results count:', stateData.results?.length || 0);
      if (stateData.results && stateData.results.length > 0) {
        console.log('First result:', stateData.results[0]);
      }
    }
    
    // Test 3: Search with office parameter
    console.log('\n=== Test 3: Search with office parameter ===');
    const officeUrl = `https://api.open.fec.gov/v1/candidates/?q=${encodeURIComponent(searchName)}&state=CA&office=H&api_key=${apiKey}`;
    console.log('URL:', officeUrl);
    
    const officeResponse = await fetch(officeUrl);
    console.log('Status:', officeResponse.status);
    if (officeResponse.ok) {
      const officeData = await officeResponse.json();
      console.log('Results count:', officeData.results?.length || 0);
      if (officeData.results && officeData.results.length > 0) {
        console.log('First result:', officeData.results[0]);
      }
    }
    
    // Test 4: Try different name formats
    console.log('\n=== Test 4: Different name formats ===');
    const nameFormats = [
      'George Whitesides',
      'Whitesides',
      'WHITESIDES, GEORGE',
      'Whitesides, George'
    ];
    
    for (const nameFormat of nameFormats) {
      console.log(`\nTrying name format: "${nameFormat}"`);
      const formatUrl = `https://api.open.fec.gov/v1/candidates/?q=${encodeURIComponent(nameFormat)}&api_key=${apiKey}`;
      const formatResponse = await fetch(formatUrl);
      console.log('Status:', formatResponse.status);
      if (formatResponse.ok) {
        const formatData = await formatResponse.json();
        console.log('Results count:', formatData.results?.length || 0);
        if (formatData.results && formatData.results.length > 0) {
          console.log('First result:', formatData.results[0]);
          break; // Stop if we find results
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testFECSearchV3();
