// Test LegiScan API with completed sessions that should have people data
require('dotenv').config({ path: '.env.local' });

async function testLegiScanCompletedSession() {
  const apiKey = process.env.LEGISCAN_API_KEY;
  console.log('Testing LegiScan API with completed sessions...');
  
  try {
    // Get session list for California
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
      console.log('All sessions found:', sessionListData.sessions?.length || 0);
      
      if (sessionListData.sessions && sessionListData.sessions.length > 0) {
        // Show all sessions
        console.log('\nAll sessions:');
        sessionListData.sessions.forEach((session, index) => {
          console.log(`${index + 1}. ${session.session_name} (ID: ${session.session_id})`);
          console.log(`   Year: ${session.year_start}-${session.year_end}`);
          console.log(`   Status: sine_die=${session.sine_die}, prior=${session.prior}, special=${session.special}`);
        });
        
        // Try the most recent completed session (prior=1 means completed)
        const completedSessions = sessionListData.sessions.filter(session => 
          session.prior === 1 && session.sine_die === 1
        );
        
        console.log('\nCompleted sessions:', completedSessions.length);
        
        if (completedSessions.length > 0) {
          const recentCompletedSession = completedSessions[0];
          console.log('Trying completed session:', recentCompletedSession.session_name);
          
          // Get session people for the completed session
          console.log('\n2. Getting session people for completed session_id:', recentCompletedSession.session_id);
          const sessionPeopleResponse = await fetch(
            `https://api.legiscan.com/?key=${apiKey}&op=getSessionPeople&id=${recentCompletedSession.session_id}`,
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
              
              // Get detailed person info
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
              console.log('No people found in completed session either');
            }
          } else {
            console.log('Session people request failed:', sessionPeopleResponse.status);
          }
        } else {
          console.log('No completed sessions found');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLegiScanCompletedSession();
