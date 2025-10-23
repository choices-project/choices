import { createClient } from '@supabase/supabase-js';

/**
 * Test Data Seeding Utility - REST API Approach
 * 
 * Uses direct REST API calls to bypass JavaScript client RLS issues
 * Based on successful curl command approach
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

// REST API helper function that mimics successful curl approach
async function restApiRequest(endpoint: string, method = 'GET', body?: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not found. Please check your environment variables.');
  }
  
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  const options: RequestInit = {
    method,
    headers
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  console.log(`Making ${method} request to: ${url}`);
  if (body) {
    console.log('Request body:', JSON.stringify(body, null, 2));
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`Response status: ${response.status}`);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error('REST API request failed:', error);
    throw error;
  }
}

// Test poll data with correct format (based on successful curl approach)
const TEST_POLLS = [
  {
    title: 'Test Poll 1 - REST API',
    description: 'Testing REST API approach for database seeding',
    options: ['Option A', 'Option B'],
    voting_method: 'single', // Correct value
    status: 'active',
    created_by: '6f12e40c-fd46-4ace-9470-2016dc0e2e8b', // Valid user ID
    privacy_level: 'public',
    category: 'test'
  },
  {
    title: 'Test Poll 2 - REST API',
    description: 'Second test poll using REST API approach',
    options: ['Choice 1', 'Choice 2', 'Choice 3'],
    voting_method: 'multiple', // Correct value
    status: 'active',
    created_by: '6f12e40c-fd46-4ace-9470-2016dc0e2e8b', // Valid user ID
    privacy_level: 'public',
    category: 'test'
  },
  {
    title: 'Test Poll 3 - REST API',
    description: 'Third test poll for comprehensive testing',
    options: ['Yes', 'No'],
    voting_method: 'single', // Correct value
    status: 'active',
    created_by: '6f12e40c-fd46-4ace-9470-2016dc0e2e8b', // Valid user ID
    privacy_level: 'public',
    category: 'test'
  }
];

/**
 * Seed test polls using REST API approach
 * This bypasses JavaScript client RLS issues
 */
export async function seedTestPollsRestApi(): Promise<string[]> {
  console.log('🌱 Starting database seeding with REST API approach...');
  
  const seededPollIds: string[] = [];
  
  try {
    // Test database connection first
    console.log('🔍 Testing database connection...');
    const connectionTest = await restApiRequest('polls?select=id&limit=1');
    console.log('✅ Database connection successful');
    console.log('Connection test result:', connectionTest);
    
    // Insert test polls one by one
    for (let i = 0; i < TEST_POLLS.length; i++) {
      const poll = TEST_POLLS[i];
      if (!poll) continue;
      console.log(`\n📝 Inserting poll ${i + 1}/${TEST_POLLS.length}: ${poll.title}`);
      
      try {
        const result = await restApiRequest('polls', 'POST', poll);
        console.log(`✅ Poll ${i + 1} inserted successfully`);
        console.log('Insert result:', result);
        
        if (result && result.length > 0 && result[0].id) {
          seededPollIds.push(result[0].id);
          console.log(`📋 Poll ID: ${result[0].id}`);
        } else {
          console.warn(`⚠️ Poll ${i + 1} inserted but no ID returned`);
        }
      } catch (insertError) {
        console.error(`❌ Failed to insert poll ${i + 1}:`, insertError);
        // Continue with other polls
      }
    }
    
    console.log(`\n🎉 Database seeding completed!`);
    console.log(`📊 Seeded ${seededPollIds.length} polls out of ${TEST_POLLS.length} attempts`);
    console.log(`📋 Seeded poll IDs: ${seededPollIds.join(', ')}`);
    
    return seededPollIds;
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

/**
 * Clean up test polls created during seeding
 */
export async function cleanupTestPollsRestApi(pollIds: string[]): Promise<void> {
  console.log('🧹 Cleaning up test polls...');
  
  for (const pollId of pollIds) {
    try {
      console.log(`🗑️ Deleting poll: ${pollId}`);
      await restApiRequest(`polls?id=eq.${pollId}`, 'DELETE');
      console.log(`✅ Poll ${pollId} deleted successfully`);
    } catch (error) {
      console.error(`❌ Failed to delete poll ${pollId}:`, error);
    }
  }
  
  console.log('✅ Cleanup completed');
}

/**
 * Verify seeded polls exist in database
 */
export async function verifySeededPollsRestApi(pollIds: string[]): Promise<boolean> {
  console.log('🔍 Verifying seeded polls...');
  
  try {
    const result = await restApiRequest(`polls?id=in.(${pollIds.join(',')})&select=id,title`);
    console.log('Verification result:', result);
    
    const foundPolls = result || [];
    console.log(`📊 Found ${foundPolls.length} polls out of ${pollIds.length} expected`);
    
    return foundPolls.length === pollIds.length;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

/**
 * Get existing polls count
 */
export async function getExistingPollsCountRestApi(): Promise<number> {
  try {
    const result = await restApiRequest('polls?select=count');
    console.log('Existing polls count result:', result);
    return result?.[0]?.count || 0;
  } catch (error) {
    console.error('❌ Failed to get polls count:', error);
    return 0;
  }
}
