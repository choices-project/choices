// Test LegiScan API with correct session_id approach
require('dotenv').config({ path: '.env.local' });

async function testLegiScanCorrect() {
  const apiKey = process.env.LEGISCAN_API_KEY;
  console.log('Testing LegiScan API with correct session_id approach...');
  
  try {
    // Step 1: Get session list for California
    console.log('1. Getting session list for California...');
    const sessionListResponse = await fetch(
      `https://api.legiscan.com/?key=${apiKey}&op=getSessionList&state=CA`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    if (sessionListResponse.ok) {
      const sessionListData = await sessionListResponse.json();
      console.log('Sessions found:', sessionListData.sessions?.length || 0);
      
      if (sessionListData.sessions && sessionListData.sessions.length > 0) {
        // Find the most recent active session
        const activeSessions = sessionListData.sessions.filter(session => 
          session.sine_die === 0 && session.prior === 0
        );
        
        console.log('Active sessions:', activeSessions.length);
        
        if (activeSessions.length > 0) {
          const currentSession = activeSessions[0];
          console.log('Current session:', currentSession);
          
          // Step 2: Get session people using the session_id
          console.log('\n2. Getting session people for session_id:', currentSession.session_id);
          const sessionPeopleResponse = await fetch(
            `https://api.legiscan.com/?key=${apiKey}&op=getSessionPeople&id=${currentSession.session_id}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }
          );
          
          console.log('Session people response status:', sessionPeopleResponse.status);
          if (sessionPeopleResponse.ok) {
            const sessionPeopleData = await sessionPeopleResponse.json();
            console.log('Session people found:', sessionPeopleData.sessionpeople?.length || 0);
            
            if (sessionPeopleData.sessionpeople && sessionPeopleData.sessionpeople.length > 0) {
              console.log('First person:', sessionPeopleData.sessionpeople[0]);
              
              // Step 3: Get detailed person info
              const person = sessionPeopleData.sessionpeople[0];
              if (person.people_id) {
                console.log('\n3. Getting detailed person info for people_id:', person.people_id);
                const personResponse = await fetch(
                  `https://api.legiscan.com/?key=${apiKey}&op=getPerson&id=${person.people_id}`,
                  {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                  }
                );
                
                if (personResponse.ok) {
                  const personData = await personResponse.json();
                  console.log('Person details:', personData.person);
                } else {
                  console.log('Person details request failed:', personResponse.status);
                }
              }
            } else {
              console.log('No people found in this session');
            }
          } else {
            console.log('Session people request failed:', sessionPeopleResponse.status);
          }
        } else {
          console.log('No active sessions found');
        }
      } else {
        console.log('No sessions found');
      }
    } else {
      console.log('Session list request failed:', sessionListResponse.status);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLegiScanCorrect();
