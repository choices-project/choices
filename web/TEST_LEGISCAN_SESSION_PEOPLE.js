require('dotenv').config({ path: '.env.local' });

async function testLegiScanSessionPeople() {
  console.log('Testing LegiScan session people approach...');
  
  const apiKey = process.env.LEGISCAN_API_KEY;
  if (!apiKey) {
    console.log('❌ LegiScan API key not configured');
    return;
  }
  
  console.log('API Key configured:', !!apiKey);
  
  try {
    // Step 1: Get session list for California
    console.log('\n1. Getting session list for California...');
    const sessionListUrl = `https://api.legiscan.com/?key=${apiKey}&op=getSessionList&state=CA`;
    console.log('Session list URL:', sessionListUrl);
    
    const sessionResponse = await fetch(sessionListUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Session response status:', sessionResponse.status);
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('Session data:', JSON.stringify(sessionData, null, 2));
      
      if (sessionData.sessions && sessionData.sessions.length > 0) {
        // Get the most recent session (but try a few recent ones)
        const sessionsToTry = sessionData.sessions.slice(0, 3); // Try last 3 sessions
        console.log('\n2. Trying sessions:', sessionsToTry.map(s => `${s.session_name} (${s.session_id})`));
        
        // Step 2: Try each session to find Anthony Rendon
        for (const session of sessionsToTry) {
          console.log(`\n3. Trying session ${session.session_id} (${session.session_name})...`);
          const peopleUrl = `https://api.legiscan.com/?key=${apiKey}&op=getSessionPeople&id=${session.session_id}`;
          
          const peopleResponse = await fetch(peopleUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (peopleResponse.ok) {
            const peopleData = await peopleResponse.json();
            
            if (peopleData.sessionpeople && peopleData.sessionpeople.people) {
              const people = peopleData.sessionpeople.people;
              console.log(`Found ${people.length} people in session ${session.session_id}`);
              
              // Look for Anthony Rendon
              const anthonyRendon = people.find(person => 
                person.first_name && person.last_name &&
                (person.first_name.toLowerCase().includes('anthony') || 
                 person.last_name.toLowerCase().includes('rendon'))
              );
              
              if (anthonyRendon) {
                console.log('\n✅ Found Anthony Rendon:', anthonyRendon);
                return; // Found him, stop searching
              }
            }
          }
        }
        
        console.log('\n❌ Anthony Rendon not found in any recent session');
      } else {
        console.log('No sessions found');
      }
    } else {
      console.log('Session list request failed');
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testLegiScanSessionPeople();
