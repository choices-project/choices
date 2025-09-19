// web/scripts/test-openstates-api.ts
import 'dotenv/config';

const OPEN_STATES_API_KEY = process.env.OPEN_STATES_API_KEY;

async function testOpenStatesAPI() {
  console.log('🔍 Testing OpenStates API...');
  console.log('API Key:', OPEN_STATES_API_KEY ? 'Present' : 'Missing');
  
  if (!OPEN_STATES_API_KEY) {
    console.error('❌ OPEN_STATES_API_KEY is not set');
    return;
  }

  // Test different possible endpoints
  const endpoints = [
    'https://v3.openstates.org/people',
    'https://openstates.org/api/v1/legislators',
    'https://api.openstates.org/v1/legislators',
    'https://openstates.org/api/v2/legislators'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing endpoint: ${endpoint}`);
    
    try {
      const url = new URL(endpoint);
      
      // Try different parameter combinations
      const testParams = [
        { jurisdiction: 'CA', chamber: 'upper' },
        { state: 'CA', chamber: 'upper' },
        { jurisdiction: 'CA' },
        { state: 'CA' }
      ];

      for (const params of testParams) {
        console.log(`  📋 Testing params:`, params);
        
        // Clear previous params
        url.search = '';
        
        // Add params
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
        
        // Add API key in different ways
        const testConfigs = [
          { headers: { 'X-API-KEY': OPEN_STATES_API_KEY } },
          { headers: { 'Authorization': `Bearer ${OPEN_STATES_API_KEY}` } },
          { headers: { 'Authorization': `Token ${OPEN_STATES_API_KEY}` } }
        ];

        for (const config of testConfigs) {
          try {
            console.log(`    🔑 Testing auth:`, Object.keys(config.headers)[0]);
            
            const response = await fetch(url.toString(), {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                ...config.headers
              }
            });

            console.log(`    📊 Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
              const data = await response.json();
              console.log(`    ✅ Success! Found ${Array.isArray(data) ? data.length : 'unknown'} records`);
              console.log(`    📄 Sample data:`, JSON.stringify(data).slice(0, 200) + '...');
              return; // Found working endpoint
            } else {
              const errorText = await response.text();
              console.log(`    ❌ Error: ${errorText.slice(0, 100)}...`);
            }
          } catch (error) {
            console.log(`    ❌ Network error:`, (error as Error).message);
          }
        }
      }
    } catch (error) {
      console.log(`  ❌ URL error:`, (error as Error).message);
    }
  }

  console.log('\n❌ No working OpenStates endpoint found');
}

testOpenStatesAPI().catch(console.error);


