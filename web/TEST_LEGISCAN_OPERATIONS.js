// Test LegiScan API with different operations
require('dotenv').config({ path: '.env.local' });

async function testLegiScanOperations() {
  const apiKey = process.env.LEGISCAN_API_KEY;
  console.log('Testing LegiScan API with different operations...');
  
  try {
    // Test 1: Get master list for California
    console.log('\n=== Test 1: getMasterList for California ===');
    const masterListResponse = await fetch(
      `https://api.legiscan.com/?key=${apiKey}&op=getMasterList&state=CA`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Master list response status:', masterListResponse.status);
    if (masterListResponse.ok) {
      const masterListData = await masterListResponse.json();
      console.log('Master list results:', masterListData.master_list?.length || 0);
      if (masterListData.master_list && masterListData.master_list.length > 0) {
        console.log('First bill:', masterListData.master_list[0]);
      }
    }
    
    // Test 2: Get session list for California
    console.log('\n=== Test 2: getSessionList for California ===');
    const sessionListResponse = await fetch(
      `https://api.legiscan.com/?key=${apiKey}&op=getSessionList&state=CA`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Session list response status:', sessionListResponse.status);
    if (sessionListResponse.ok) {
      const sessionListData = await sessionListResponse.json();
      console.log('Session list results:', sessionListData.sessions?.length || 0);
      if (sessionListData.sessions && sessionListData.sessions.length > 0) {
        console.log('First session:', sessionListData.sessions[0]);
        
        // If we have sessions, try getSessionPeople with the session ID
        const session = sessionListData.sessions[0];
        if (session.session_id) {
          console.log('\n=== Test 3: getSessionPeople with session ID ===');
          const sessionPeopleResponse = await fetch(
            `https://api.legiscan.com/?key=${apiKey}&op=getSessionPeople&id=${session.session_id}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }
          );
          
          console.log('Session people response status:', sessionPeopleResponse.status);
          if (sessionPeopleResponse.ok) {
            const sessionPeopleData = await sessionPeopleResponse.json();
            console.log('Session people results:', sessionPeopleData.sessionpeople?.length || 0);
            if (sessionPeopleData.sessionpeople && sessionPeopleData.sessionpeople.length > 0) {
              console.log('First person:', sessionPeopleData.sessionpeople[0]);
            }
          }
        }
      }
    }
    
    // Test 3: Search for people by name
    console.log('\n=== Test 4: Search for people by name ===');
    const searchResponse = await fetch(
      `https://api.legiscan.com/?key=${apiKey}&op=search&state=CA&query=Whitesides`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Search response status:', searchResponse.status);
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('Search results:', searchData.search?.length || 0);
      if (searchData.search && searchData.search.length > 0) {
        console.log('First search result:', searchData.search[0]);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLegiScanOperations();
