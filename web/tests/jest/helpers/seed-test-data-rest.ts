/**
 * Test Data Seeding Helper - REST API Version
 * 
 * This version uses direct REST API calls to bypass Supabase client issues
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

export interface TestPoll {
  id?: string;
  title: string;
  description: string;
  options: string[];
  voting_method: 'single_choice' | 'multiple_choice' | 'ranked_choice' | 'approval_voting';
  status: 'draft' | 'active' | 'closed';
  created_by: string; // UUID reference to auth.users
  end_date?: string;
  settings: Record<string, any>;
  hashtags: string[];
  poll_settings: Record<string, any>;
  privacy_level: string; // This is the key field for RLS!
  category?: string;
  tags?: string[];
  primary_hashtag?: string;
  total_votes?: number;
  participation_rate?: number;
}

export const TEST_POLLS: TestPoll[] = [
  {
    title: "What's your favorite programming language?",
    description: "Help us understand the community's preferences for programming languages in 2025.",
    options: ["JavaScript/TypeScript", "Python", "Rust", "Go", "Java", "C++"],
    voting_method: "single_choice",
    status: "active",
    created_by: "00000000-0000-0000-0000-000000000001", // UUID for test user
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    settings: {
      allow_anonymous: true,
      show_results_before_close: true,
      allow_multiple_votes: false
    },
    hashtags: ["programming", "technology", "development"],
    poll_settings: {
      voting_method: "single_choice",
      result_display: "percentage"
    },
    privacy_level: "public", // This is the key field for RLS!
    category: "technology",
    tags: ["programming", "development"],
    primary_hashtag: "programming",
    total_votes: 0,
    participation_rate: 0
  },
  {
    title: "Which features should we prioritize for the next release?",
    description: "Vote for multiple features you'd like to see in the upcoming release.",
    options: [
      "Dark mode theme",
      "Mobile app improvements", 
      "Real-time notifications",
      "Advanced analytics",
      "API rate limiting",
      "User dashboard redesign"
    ],
    voting_method: "multiple_choice",
    status: "active",
    created_by: "00000000-0000-0000-0000-000000000001",
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    settings: {
      allow_anonymous: false,
      show_results_before_close: false,
      allow_multiple_votes: true,
      max_selections: 3
    },
    hashtags: ["features", "roadmap", "product"],
    poll_settings: {
      voting_method: "multiple_choice",
      result_display: "count"
    },
    privacy_level: "public",
    category: "product",
    tags: ["features", "roadmap"],
    primary_hashtag: "features",
    total_votes: 0,
    participation_rate: 0
  },
  {
    title: "Rank your preferred meeting times",
    description: "Help us schedule the best time for our weekly team meetings.",
    options: [
      "Monday 9:00 AM",
      "Tuesday 2:00 PM", 
      "Wednesday 10:00 AM",
      "Thursday 3:00 PM",
      "Friday 11:00 AM"
    ],
    voting_method: "ranked_choice",
    status: "active",
    created_by: "00000000-0000-0000-0000-000000000001",
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    settings: {
      allow_anonymous: true,
      show_results_before_close: true,
      allow_multiple_votes: false
    },
    hashtags: ["scheduling", "meetings", "team"],
    poll_settings: {
      voting_method: "ranked_choice",
      result_display: "ranked"
    },
    privacy_level: "public",
    category: "scheduling",
    tags: ["meetings", "team"],
    primary_hashtag: "scheduling",
    total_votes: 0,
    participation_rate: 0
  },
  {
    title: "Which projects should receive funding?",
    description: "Approve or disapprove each project for the next funding cycle.",
    options: [
      "Community Garden Initiative",
      "Local Food Bank Support",
      "Youth Sports Program",
      "Senior Center Renovation",
      "Environmental Cleanup Project"
    ],
    voting_method: "approval_voting",
    status: "active",
    created_by: "00000000-0000-0000-0000-000000000001",
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    settings: {
      allow_anonymous: false,
      show_results_before_close: true,
      allow_multiple_votes: true
    },
    hashtags: ["funding", "community", "civic"],
    poll_settings: {
      voting_method: "approval_voting",
      result_display: "approval_percentage"
    },
    privacy_level: "public",
    category: "civic",
    tags: ["funding", "community"],
    primary_hashtag: "funding",
    total_votes: 0,
    participation_rate: 0
  },
  {
    title: "Draft: What should we name our new product?",
    description: "This is a draft poll that hasn't been published yet.",
    options: ["Choices Pro", "CivicHub", "DemocracyNow", "VoteRight", "CommunityVoice"],
    voting_method: "single_choice",
    status: "draft",
    created_by: "00000000-0000-0000-0000-000000000001",
    settings: {
      allow_anonymous: true,
      show_results_before_close: false,
      allow_multiple_votes: false
    },
    hashtags: ["naming", "product", "draft"],
    poll_settings: {
      voting_method: "single_choice",
      result_display: "percentage"
    },
    privacy_level: "private",
    category: "product",
    tags: ["naming", "draft"],
    primary_hashtag: "naming",
    total_votes: 0,
    participation_rate: 0
  },
  {
    title: "Closed: Best coffee shop in town",
    description: "This poll has already closed and shows final results.",
    options: ["Starbucks", "Local Brew", "Dunkin'", "Peet's Coffee", "Independent Cafe"],
    voting_method: "single_choice",
    status: "closed",
    created_by: "00000000-0000-0000-0000-000000000001",
    end_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    settings: {
      allow_anonymous: true,
      show_results_before_close: true,
      allow_multiple_votes: false
    },
    hashtags: ["coffee", "local", "business"],
    poll_settings: {
      voting_method: "single_choice",
      result_display: "percentage"
    },
    privacy_level: "public",
    category: "local",
    tags: ["coffee", "business"],
    primary_hashtag: "coffee",
    total_votes: 0,
    participation_rate: 0
  }
];

// REST API helper function
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
    'Content-Type': 'application/json'
  };
  
  const options: RequestInit = {
    method,
    headers
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  return { data, status: response.status, response };
}

export async function seedTestPolls(): Promise<string[]> {
  console.log('🌱 Seeding test polls data using REST API...');
  
  try {
    // Check if polls table exists using REST API
    const { data: tableCheck, status: tableStatus } = await restApiRequest('polls?select=id&limit=1');
    
    if (tableStatus !== 200) {
      throw new Error(`Polls table not accessible: HTTP ${tableStatus}`);
    }
    
    console.log('✅ Polls table exists, proceeding with seeding...');
    
    // Clear existing test data using REST API
    const { status: deleteStatus } = await restApiRequest('polls?title=like.Test*', 'DELETE');
    
    if (deleteStatus !== 200 && deleteStatus !== 204) {
      console.warn('⚠️ Could not clear existing test data:', `HTTP ${deleteStatus}`);
    } else {
      console.log('🧹 Cleared existing test data');
    }
    
    const seededPollIds: string[] = [];
    
    for (const poll of TEST_POLLS) {
      console.log(`🔄 Attempting to insert poll: "${poll.title}"`);
      console.log('Poll data:', poll);
      
      const { data: insertedPoll, status: insertStatus } = await restApiRequest('polls', 'POST', poll);
      
      console.log('Insert result:', { insertedPoll, insertStatus });
      
      if (insertStatus !== 201) {
        console.error(`❌ Failed to insert poll "${poll.title}": HTTP ${insertStatus}`);
        continue;
      }
      
      if (insertedPoll && insertedPoll.length > 0) {
        seededPollIds.push(insertedPoll[0].id);
        console.log(`✅ Successfully inserted poll: "${poll.title}" with ID: ${insertedPoll[0].id}`);
      } else {
        console.warn(`⚠️ No data returned for poll: ${poll.title}`);
      }
    }
    
    console.log(`✅ Successfully seeded ${seededPollIds.length} test polls`);
    console.log(`📊 Seeded poll IDs: ${JSON.stringify(seededPollIds)}`);
    
    return seededPollIds;
    
  } catch (error) {
    console.error('❌ Error seeding test polls:', error);
    throw error;
  }
}

export async function cleanupTestPolls(pollIds: string[]): Promise<void> {
  console.log('🧹 Cleaning up test data...');
  
  try {
    for (const pollId of pollIds) {
      const { status: deleteStatus } = await restApiRequest(`polls?id=eq.${pollId}`, 'DELETE');
      
      if (deleteStatus !== 200 && deleteStatus !== 204) {
        console.warn(`⚠️ Could not delete poll ${pollId}: HTTP ${deleteStatus}`);
      } else {
        console.log(`✅ Deleted poll ${pollId}`);
      }
    }
    
    console.log('✅ Test data cleanup completed');
    
  } catch (error) {
    console.error('❌ Error cleaning up test polls:', error);
    throw error;
  }
}
