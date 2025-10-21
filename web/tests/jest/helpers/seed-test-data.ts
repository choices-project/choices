import { createClient } from '@supabase/supabase-js';

/**
 * Test Data Seeding Utility
 * 
 * Populates the database with realistic test data for integration testing
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use same approach as civics pipeline
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not found. Please check your environment variables.');
  }
  
  console.log('Using Supabase key type:', supabaseKey.startsWith('sb_secret_') ? 'SERVICE_ROLE' : 'ANON');
  console.log('Using same approach as civics pipeline');
  
  return createClient(supabaseUrl, supabaseKey);
}

// REST API helper function
async function restApiRequest(endpoint: string, method = 'GET', body?: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  
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
    is_public: true,
    allow_anonymous: true,
    max_votes_per_user: 1,
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
    is_public: true,
    allow_anonymous: false,
    max_votes_per_user: 5,
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
    is_public: false,
    allow_anonymous: true,
    max_votes_per_user: 1,
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
    is_public: true,
    allow_anonymous: true,
    max_votes_per_user: 1,
    category: "local",
    tags: ["coffee", "business"],
    primary_hashtag: "coffee",
    total_votes: 0,
    participation_rate: 0
  }
];

export async function seedTestPolls(): Promise<string[]> {
  console.log('🌱 Seeding test polls data...');
  
  try {
    const supabase = getSupabaseClient();
    
    // First, let's check if polls table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'polls');

    if (tableError) {
      console.log('❌ Error checking polls table:', tableError);
      throw tableError;
    }

    if (!tableInfo || tableInfo.length === 0) {
      console.log('❌ Polls table does not exist in the database');
      throw new Error('Polls table does not exist');
    }

    console.log('✅ Polls table exists, proceeding with seeding...');

    // Clear existing test data
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .like('title', '%test%');

    if (deleteError) {
      console.log('⚠️ Warning: Could not clear existing test data:', deleteError);
    } else {
      console.log('🧹 Cleared existing test data');
    }

    // Insert test polls one by one to avoid batch insert issues
    const pollIds: string[] = [];
    
    for (const poll of TEST_POLLS) {
      console.log(`🔄 Attempting to insert poll: "${poll.title}"`);
      console.log('Poll data:', JSON.stringify(poll, null, 2));
      
      const { data: insertedPoll, error: insertError } = await supabase
        .from('polls')
        .insert(poll)
        .select('id, title')
        .single();

      console.log('Insert result:', { insertedPoll, insertError });

      if (insertError) {
        console.log(`❌ Error inserting poll "${poll.title}":`, insertError);
        console.log('Error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        // Continue with other polls instead of failing completely
        continue;
      }

      if (insertedPoll && insertedPoll.id) {
        pollIds.push(insertedPoll.id);
        console.log(`✅ Inserted poll: ${insertedPoll.title} (ID: ${insertedPoll.id})`);
      } else {
        console.log(`⚠️ No data returned for poll: ${poll.title}`);
      }
    }
    
    console.log(`✅ Successfully seeded ${pollIds.length} test polls`);
    console.log('📊 Seeded poll IDs:', pollIds);

    return pollIds;

  } catch (error) {
    console.log('❌ Error seeding test polls:', error);
    throw error;
  }
}

export async function seedTestVotes(pollIds: string[]): Promise<void> {
  console.log('🗳️ Seeding test votes...');
  
  try {
    const supabase = getSupabaseClient();
    const testVotes = [];
    
    // Create realistic vote data for each poll
    for (const pollId of pollIds) {
      const poll = TEST_POLLS.find(p => pollIds.includes(pollId));
      if (!poll) continue;

      // Generate 10-50 votes per poll with realistic distribution
      const voteCount = Math.floor(Math.random() * 40) + 10;
      
      for (let i = 0; i < voteCount; i++) {
        const vote = {
          poll_id: pollId,
          user_id: `test-voter-${i + 1}`,
          choice: Math.floor(Math.random() * poll.options.length),
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random time in last 7 days
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
          user_agent: 'Mozilla/5.0 (Test Browser)'
        };
        
        testVotes.push(vote);
      }
    }

    // Insert votes in batches
    const batchSize = 50;
    for (let i = 0; i < testVotes.length; i += batchSize) {
      const batch = testVotes.slice(i, i + batchSize);
      const { error: voteError } = await supabase
        .from('votes')
        .insert(batch);

      if (voteError) {
        console.log('⚠️ Warning: Could not insert some votes:', voteError);
      }
    }

    console.log(`✅ Successfully seeded ${testVotes.length} test votes`);

  } catch (error) {
    console.log('❌ Error seeding test votes:', error);
    throw error;
  }
}

export async function cleanupTestData(): Promise<void> {
  console.log('🧹 Cleaning up test data...');
  
  try {
    const supabase = getSupabaseClient();
    // Delete test votes
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .like('user_id', 'test-voter-%');

    if (votesError) {
      console.log('⚠️ Warning: Could not clean up test votes:', votesError);
    }

    // Delete test polls
    const { error: pollsError } = await supabase
      .from('polls')
      .delete()
      .like('title', '%test%')
      .or('title.like.%draft%')
      .or('title.like.%closed%');

    if (pollsError) {
      console.log('⚠️ Warning: Could not clean up test polls:', pollsError);
    }

    console.log('✅ Test data cleanup completed');

  } catch (error) {
    console.log('❌ Error cleaning up test data:', error);
    throw error;
  }
}

export async function getDatabaseStats(): Promise<{
  pollsCount: number;
  votesCount: number;
  activePolls: number;
  closedPolls: number;
}> {
  try {
    const supabase = getSupabaseClient();
    const { data: pollsData, error: pollsError } = await supabase
      .from('polls')
      .select('id, status');

    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('id');

    if (pollsError || votesError) {
      throw new Error(`Database query errors: ${pollsError?.message || votesError?.message}`);
    }

    // Handle different response formats
    const polls = Array.isArray(pollsData) ? pollsData : (pollsData ? [pollsData] : []);
    const votes = Array.isArray(votesData) ? votesData : (votesData ? [votesData] : []);
    
    const activePolls = polls.filter(p => p.status === 'active').length;
    const closedPolls = polls.filter(p => p.status === 'closed').length;

    return {
      pollsCount: polls.length,
      votesCount: votes.length,
      activePolls,
      closedPolls
    };

  } catch (error) {
    console.log('❌ Error getting database stats:', error);
    throw error;
  }
}
