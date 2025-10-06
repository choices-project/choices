// Test LegiScan API with different states that might have people data
require('dotenv').config({ path: '.env.local' });

async function testLegiScanDifferentState() {
  const apiKey = process.env.LEGISCAN_API_KEY;
  console.log('Testing LegiScan API with different states...');
  
  try {
    // Test with different states
    const states = ['TX', 'FL', 'NY', 'IL', 'PA'];
    
    for (const state of states) {
      console.log(`\n=== Testing ${state} ===`);
      
      // Get session list for this state
      const sessionListResponse = await fetch(
        `https://api.legiscan.com/?key=${apiKey}&op=getSessionList&state=${state}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (sessionListResponse.ok) {
        const sessionListData = await sessionListResponse.json();
        console.log(`${state} sessions found:`, sessionListData.sessions?.length || 0);
        
        if (sessionListData.sessions && sessionListData.sessions.length > 0) {
          // Try the most recent session
          const recentSession = sessionListData.sessions[0];
          console.log(`Recent session: ${recentSession.session_name} (ID: ${recentSession.session_id})`);
          
          // Get session people for this session
          const sessionPeopleResponse = await fetch(
            `https://api.legiscan.com/?key=${apiKey}&op=getSessionPeople&id=${recentSession.session_id}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }
          );
          
          if (sessionPeopleResponse.ok) {
            const sessionPeopleData = await sessionPeopleResponse.json();
            const peopleCount = sessionPeopleData.sessionpeople?.length || 0;
            console.log(`${state} session people found:`, peopleCount);
            
            if (peopleCount > 0) {
              console.log('SUCCESS! Found people in', state);
              console.log('First person:', sessionPeopleData.sessionpeople[0]);
              break; // Stop if we find people data
            }
          } else {
            console.log(`${state} session people request failed:`, sessionPeopleResponse.status);
          }
        }
      } else {
        console.log(`${state} session list request failed:`, sessionListResponse.status);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLegiScanDifferentState();
