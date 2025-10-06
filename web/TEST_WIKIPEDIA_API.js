// Test Wikipedia API directly
require('dotenv').config({ path: '.env.local' });

async function testWikipediaAPI() {
  console.log('Testing Wikipedia API...');
  
  try {
    // Test Wikipedia API with George Whitesides
    console.log('1. Testing Wikipedia search...');
    const searchResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/George_Whitesides`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Search response status:', searchResponse.status);
    console.log('Search response ok:', searchResponse.ok);
    
    if (searchResponse.ok) {
      const data = await searchResponse.json();
      console.log('Wikipedia response:');
      console.log('Title:', data.title);
      console.log('Extract:', data.extract?.substring(0, 200) + '...');
      console.log('Thumbnail:', data.thumbnail?.source);
      console.log('URL:', data.content_urls?.desktop?.page);
    } else {
      const errorText = await searchResponse.text();
      console.log('Wikipedia search error:', errorText);
    }
    
    // Test with a more general search
    console.log('\n2. Testing Wikipedia search with different name format...');
    const searchResponse2 = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/George_Whitesides_(politician)`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Search 2 response status:', searchResponse2.status);
    if (searchResponse2.ok) {
      const data2 = await searchResponse2.json();
      console.log('Wikipedia response 2:');
      console.log('Title:', data2.title);
      console.log('Extract:', data2.extract?.substring(0, 200) + '...');
    } else {
      console.log('Wikipedia search 2 failed:', searchResponse2.status);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testWikipediaAPI();
