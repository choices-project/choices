import { describe, it, expect } from '@jest/globals';

/**
 * Test REST API Approach
 * 
 * Tests database access using direct REST API calls (like curl)
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Test REST API Approach', () => {
  it('should test database access using REST API', async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }
    
    console.log('🔍 Testing database access using REST API...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key (first 10 chars):', supabaseKey.substring(0, 10));
    
    // Test 1: Query polls using REST API
    console.log('🔍 Test 1: Query polls using REST API');
    const pollsResponse = await fetch(`${supabaseUrl}/rest/v1/polls?select=id,title,description,privacy_level,status&limit=5`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const pollsData = await pollsResponse.json();
    console.log('Polls REST API result:', { pollsData, status: pollsResponse.status });
    
    // Test 2: Get polls count using REST API
    console.log('🔍 Test 2: Get polls count using REST API');
    const countResponse = await fetch(`${supabaseUrl}/rest/v1/polls?select=id&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    const countHeader = countResponse.headers.get('content-range');
    console.log('Polls count REST API result:', { countHeader, status: countResponse.status });
    
    // Test 3: Insert a test poll using REST API
    console.log('🔍 Test 3: Insert test poll using REST API');
    const testPoll = {
      title: 'Test Poll from REST API',
      description: 'Testing database access using REST API approach',
      options: ['Option 1', 'Option 2', 'Option 3'],
      voting_method: 'single_choice',
      status: 'active',
      created_by: '00000000-0000-0000-0000-000000000001',
      privacy_level: 'public',
      category: 'test',
      tags: ['test', 'rest-api'],
      hashtags: ['test', 'rest-api'],
      primary_hashtag: 'test'
    };
    
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/polls`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testPoll)
    });
    
    const insertData = await insertResponse.json();
    console.log('Insert poll REST API result:', { insertData, status: insertResponse.status });
    
    // Test 4: Query the inserted poll using REST API
    if (insertData && insertData.length > 0) {
      console.log('🔍 Test 4: Query inserted poll using REST API');
      const queryResponse = await fetch(`${supabaseUrl}/rest/v1/polls?id=eq.${insertData[0].id}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const queryData = await queryResponse.json();
      console.log('Query inserted poll REST API result:', { queryData, status: queryResponse.status });
      
      // Clean up - delete the test poll using REST API
      console.log('🔍 Cleanup: Delete test poll using REST API');
      const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/polls?id=eq.${insertData[0].id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Delete poll REST API result:', { status: deleteResponse.status });
    }
    
    // Test 5: Test with different privacy levels using REST API
    console.log('🔍 Test 5: Test different privacy levels using REST API');
    const publicPollsResponse = await fetch(`${supabaseUrl}/rest/v1/polls?privacy_level=eq.public&select=id,title,privacy_level&limit=3`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const publicPollsData = await publicPollsResponse.json();
    console.log('Public polls REST API result:', { publicPollsData, status: publicPollsResponse.status });
    
    // Test 6: Test with different statuses using REST API
    console.log('🔍 Test 6: Test different statuses using REST API');
    const activePollsResponse = await fetch(`${supabaseUrl}/rest/v1/polls?status=eq.active&select=id,title,status&limit=3`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const activePollsData = await activePollsResponse.json();
    console.log('Active polls REST API result:', { activePollsData, status: activePollsResponse.status });
    
    // Test 7: Test with different created_by values using REST API
    console.log('🔍 Test 7: Test different created_by values using REST API');
    const userPollsResponse = await fetch(`${supabaseUrl}/rest/v1/polls?created_by=eq.00000000-0000-0000-0000-000000000001&select=id,title,created_by&limit=3`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const userPollsData = await userPollsResponse.json();
    console.log('User polls REST API result:', { userPollsData, status: userPollsResponse.status });
    
    // Test 8: Test with different categories using REST API
    console.log('🔍 Test 8: Test different categories using REST API');
    const categoryPollsResponse = await fetch(`${supabaseUrl}/rest/v1/polls?category=eq.technology&select=id,title,category&limit=3`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const categoryPollsData = await categoryPollsResponse.json();
    console.log('Category polls REST API result:', { categoryPollsData, status: categoryPollsResponse.status });
    
    // Test 9: Test with different voting methods using REST API
    console.log('🔍 Test 9: Test different voting methods using REST API');
    const votingMethodPollsResponse = await fetch(`${supabaseUrl}/rest/v1/polls?voting_method=eq.single_choice&select=id,title,voting_method&limit=3`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const votingMethodPollsData = await votingMethodPollsResponse.json();
    console.log('Voting method polls REST API result:', { votingMethodPollsData, status: votingMethodPollsResponse.status });
    
    // Test 10: Test with different statuses using REST API
    console.log('🔍 Test 10: Test different statuses using REST API');
    const statusPollsResponse = await fetch(`${supabaseUrl}/rest/v1/polls?status=eq.active&select=id,title,status&limit=3`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const statusPollsData = await statusPollsResponse.json();
    console.log('Status polls REST API result:', { statusPollsData, status: statusPollsResponse.status });
    
    // The test should pass if we can access the database
    expect(pollsResponse.status).toBe(200);
    expect(countResponse.status).toBe(200);
    expect(insertResponse.status).toBe(201);
    expect(publicPollsResponse.status).toBe(200);
    expect(activePollsResponse.status).toBe(200);
    expect(userPollsResponse.status).toBe(200);
    expect(categoryPollsResponse.status).toBe(200);
    expect(votingMethodPollsResponse.status).toBe(200);
    expect(statusPollsResponse.status).toBe(200);
    
    // Verify we got actual data
    expect(pollsData.length).toBeGreaterThan(0);
    expect(publicPollsData.length).toBeGreaterThan(0);
    expect(activePollsData.length).toBeGreaterThan(0);
  });
});
