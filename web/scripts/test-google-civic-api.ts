// web/scripts/test-google-civic-api.ts
import 'dotenv/config';

const GOOGLE_KEY = process.env.GOOGLE_CIVIC_INFO_API_KEY || process.env.GOOGLE_CIVIC_API_KEY;

async function testGoogleCivicAPI() {
  console.log('🔍 Testing Google Civic API...');
  console.log('API Key:', GOOGLE_KEY ? 'Present' : 'Missing');
  
  if (!GOOGLE_KEY) {
    console.error('❌ Google Civic API key is not set');
    return;
  }

  const OCD_SF_PLACE = 'ocd-division/country:us/state:ca/place:san_francisco';
  const OCD_SF_COUNTY = 'ocd-division/country:us/state:ca/county:san_francisco';

  // Test different endpoints and parameters
  const testCases = [
    {
      name: 'SF Place (ocdId)',
      url: `https://www.googleapis.com/civicinfo/v2/representatives?ocdId=${OCD_SF_PLACE}&key=${GOOGLE_KEY}`
    },
    {
      name: 'SF County (ocdId)',
      url: `https://www.googleapis.com/civicinfo/v2/representatives?ocdId=${OCD_SF_COUNTY}&key=${GOOGLE_KEY}`
    },
    {
      name: 'SF Address Lookup',
      url: `https://www.googleapis.com/civicinfo/v2/representatives?address=1%20Dr%20Carlton%20B%20Goodlett%20Pl%2C%20San%20Francisco%2C%20CA%2094102&key=${GOOGLE_KEY}`
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`   URL: ${testCase.url.replace(GOOGLE_KEY, 'HIDDEN_KEY')}`);
    
    try {
      const response = await fetch(testCase.url);
      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success!`);
        console.log(`   📄 Offices: ${data.offices?.length || 0}`);
        console.log(`   👥 Officials: ${data.officials?.length || 0}`);
        console.log(`   🏛️ Divisions: ${Object.keys(data.divisions || {}).length}`);
        
        if (data.offices && data.offices.length > 0) {
          console.log(`   📋 Sample office: ${data.offices[0].name}`);
        }
        if (data.officials && data.officials.length > 0) {
          console.log(`   👤 Sample official: ${data.officials[0].name}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.slice(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${(error as Error).message}`);
    }
  }
}

testGoogleCivicAPI().catch(console.error);


