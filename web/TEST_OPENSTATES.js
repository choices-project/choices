// Test OpenStates API directly
require('dotenv').config({ path: '.env.local' });

async function testOpenStates() {
  const apiKey = process.env.OPEN_STATES_API_KEY;
  console.log('Testing OpenStates API...');
  console.log('API Key configured:', !!apiKey);
  
  try {
    // Test with California (should have state legislators)
    const response = await fetch(
      `https://v3.openstates.org/people?jurisdiction=California`,
      {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data keys:', Object.keys(data));
      console.log('Results count:', data.results?.length || 0);
      
      if (data.results && data.results.length > 0) {
        console.log('First legislator structure:');
        console.log(JSON.stringify(data.results[0], null, 2));
        
        // Look for social media data
        const firstLegislator = data.results[0];
        if (firstLegislator.social_media) {
          console.log('Social media found:', firstLegislator.social_media);
        } else {
          console.log('No social media data found');
        }
        
        if (firstLegislator.contact_details) {
          console.log('Contact details found:', firstLegislator.contact_details);
        } else {
          console.log('No contact details found');
        }
      }
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testOpenStates();
