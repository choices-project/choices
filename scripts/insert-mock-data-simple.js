#!/usr/bin/env node

/**
 * Insert Mock Data for Automated Polls (Simple Version)
 * 
 * This script inserts mock data into the automated polls database tables.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function insertMockData() {
  console.log('🚀 Inserting Mock Data for Automated Polls...\n');

  try {
    // Insert trending topics
    console.log('📊 Inserting trending topics...');
    
    const mockTopics = [
      {
        title: 'Gavin Newsom vs Donald Trump: Political Feud Escalates',
        description: 'California Governor Gavin Newsom and former President Donald Trump engage in heated political exchanges over policy differences and personal attacks.',
        source_url: 'https://example.com/news/politics/newsom-trump-feud',
        source_name: 'Political News Network',
        source_type: 'news',
        category: ['Politics', 'Government'],
        trending_score: 95.0,
        velocity: 8.5,
        momentum: 7.2,
        sentiment_score: -0.3,
        entities: [
          { name: 'Gavin Newsom', type: 'person', confidence: 0.95 },
          { name: 'Donald Trump', type: 'person', confidence: 0.95 }
        ],
        metadata: { engagement: 'high', controversy: 'high' },
        processing_status: 'pending'
      },
      {
        title: 'SpaceX Starship Launch: Latest Mission Results',
        description: 'SpaceX successfully launches Starship prototype with improved landing capabilities and mission objectives.',
        source_url: 'https://example.com/tech/spacex-starship-launch',
        source_name: 'Tech Space News',
        source_type: 'news',
        category: ['Technology', 'Space'],
        trending_score: 87.0,
        velocity: 6.8,
        momentum: 5.4,
        sentiment_score: 0.7,
        entities: [
          { name: 'SpaceX', type: 'organization', confidence: 0.9 },
          { name: 'Starship', type: 'concept', confidence: 0.85 }
        ],
        metadata: { engagement: 'medium', controversy: 'low' },
        processing_status: 'rejected'
      },
      {
        title: 'Olympic Games 2024: Preparations and Controversies',
        description: 'Paris prepares for the 2024 Olympic Games while addressing concerns about security, infrastructure, and athlete accommodations.',
        source_url: 'https://example.com/sports/olympics-2024-preparations',
        source_name: 'Sports International',
        source_type: 'news',
        category: ['Sports', 'International'],
        trending_score: 82.0,
        velocity: 5.2,
        momentum: 4.8,
        sentiment_score: 0.2,
        entities: [
          { name: 'Olympic Games 2024', type: 'event', confidence: 0.9 },
          { name: 'Paris', type: 'location', confidence: 0.85 }
        ],
        metadata: { engagement: 'high', controversy: 'medium' },
        processing_status: 'approved'
      },
      {
        title: 'AI Regulation: Global Policy Developments',
        description: 'Countries worldwide implement new AI regulations and policies to address ethical concerns and technological advancement.',
        source_url: 'https://example.com/tech/ai-regulation-global',
        source_name: 'Tech Policy Review',
        source_type: 'news',
        category: ['Technology', 'Policy'],
        trending_score: 78.0,
        velocity: 4.5,
        momentum: 3.9,
        sentiment_score: 0.1,
        entities: [
          { name: 'AI Regulation', type: 'concept', confidence: 0.8 },
          { name: 'Global Policy', type: 'concept', confidence: 0.75 }
        ],
        metadata: { engagement: 'medium', controversy: 'low' },
        processing_status: 'pending'
      },
      {
        title: 'Climate Change: New Scientific Findings',
        description: 'Recent studies reveal concerning trends in global climate patterns and their impact on ecosystems worldwide.',
        source_url: 'https://example.com/science/climate-change-findings',
        source_name: 'Science Daily',
        source_type: 'academic',
        category: ['Science', 'Environment'],
        trending_score: 75.0,
        velocity: 3.8,
        momentum: 3.2,
        sentiment_score: -0.4,
        entities: [
          { name: 'Climate Change', type: 'concept', confidence: 0.9 },
          { name: 'Global Ecosystems', type: 'concept', confidence: 0.8 }
        ],
        metadata: { engagement: 'medium', controversy: 'medium' },
        processing_status: 'pending'
      }
    ];

    const { data: topicsData, error: topicsError } = await supabase
      .from('trending_topics')
      .insert(mockTopics)
      .select();

    if (topicsError) {
      console.error('❌ Error inserting trending topics:', topicsError);
      throw topicsError;
    }

    console.log(`✅ Inserted ${topicsData.length} trending topics`);

    // Insert generated polls
    console.log('\n📊 Inserting generated polls...');
    
    const mockPolls = [
      {
        topic_id: topicsData[0].id, // Gavin Newsom vs Trump topic
        title: 'Who do you think is winning the political feud between Gavin Newsom and Donald Trump?',
        description: 'Based on recent exchanges and public opinion polls, who appears to be gaining more support?',
        options: [
          { id: '1', text: 'Gavin Newsom is winning', description: 'Newsom has stronger arguments and public support' },
          { id: '2', text: 'Donald Trump is winning', description: 'Trump has more vocal supporters and media attention' },
          { id: '3', text: 'It\'s too close to call', description: 'Both sides have valid points and strong followings' },
          { id: '4', text: 'Neither is winning', description: 'The feud is damaging to both political parties' }
        ],
        voting_method: 'single',
        category: 'Politics',
        tags: ['politics', 'newsom', 'trump', 'feud'],
        quality_score: 8.5,
        status: 'pending',
        topic_analysis: { sentiment: 'negative', controversy: 'high' },
        quality_metrics: { bias: 0.2, clarity: 0.9, completeness: 0.8 },
        generation_metadata: { source: 'automated', confidence: 0.85 }
      },
      {
        topic_id: topicsData[2].id, // Olympic Games topic
        title: 'How confident are you that the 2024 Paris Olympics will be successful?',
        description: 'Considering the preparations, security measures, and infrastructure development, what\'s your confidence level?',
        options: [
          { id: '1', text: 'Very confident', description: 'Paris is well-prepared and will deliver an excellent Olympics' },
          { id: '2', text: 'Somewhat confident', description: 'Most aspects are ready, with minor concerns' },
          { id: '3', text: 'Not very confident', description: 'There are significant concerns about readiness' },
          { id: '4', text: 'Not confident at all', description: 'The Olympics will face major problems' }
        ],
        voting_method: 'single',
        category: 'Sports',
        tags: ['olympics', 'paris', 'sports', 'international'],
        quality_score: 7.8,
        status: 'approved',
        topic_analysis: { sentiment: 'neutral', controversy: 'medium' },
        quality_metrics: { bias: 0.1, clarity: 0.8, completeness: 0.7 },
        generation_metadata: { source: 'automated', confidence: 0.75 }
      },
      {
        topic_id: topicsData[3].id, // AI Regulation topic
        title: 'What approach should governments take to AI regulation?',
        description: 'As AI technology advances rapidly, what regulatory approach do you think is most appropriate?',
        options: [
          { id: '1', text: 'Strict regulation', description: 'Heavy oversight to prevent misuse and ensure safety' },
          { id: '2', text: 'Moderate regulation', description: 'Balanced approach with some oversight but not stifling innovation' },
          { id: '3', text: 'Light regulation', description: 'Minimal oversight to encourage innovation and development' },
          { id: '4', text: 'No regulation', description: 'Let the market and industry self-regulate' }
        ],
        voting_method: 'single',
        category: 'Technology',
        tags: ['ai', 'regulation', 'technology', 'policy'],
        quality_score: 8.2,
        status: 'pending',
        topic_analysis: { sentiment: 'neutral', controversy: 'medium' },
        quality_metrics: { bias: 0.15, clarity: 0.9, completeness: 0.85 },
        generation_metadata: { source: 'automated', confidence: 0.8 }
      }
    ];

    const { data: pollsData, error: pollsError } = await supabase
      .from('generated_polls')
      .insert(mockPolls)
      .select();

    if (pollsError) {
      console.error('❌ Error inserting generated polls:', pollsError);
      throw pollsError;
    }

    console.log(`✅ Inserted ${pollsData.length} generated polls`);

    // Insert data sources
    console.log('\n📊 Inserting data sources...');
    
    const mockDataSources = [
      {
        name: 'News API',
        type: 'news',
        api_endpoint: 'https://newsapi.org/v2',
        rate_limit: 1000,
        reliability: 0.95,
        is_active: true,
        success_rate: 98.5
      },
      {
        name: 'Twitter API',
        type: 'social',
        api_endpoint: 'https://api.twitter.com/2',
        rate_limit: 300,
        reliability: 0.85,
        is_active: true,
        success_rate: 92.0
      },
      {
        name: 'Google Trends',
        type: 'search',
        api_endpoint: 'https://trends.google.com/api',
        rate_limit: 500,
        reliability: 0.90,
        is_active: true,
        success_rate: 95.5
      }
    ];

    const { data: sourcesData, error: sourcesError } = await supabase
      .from('data_sources')
      .insert(mockDataSources)
      .select();

    if (sourcesError) {
      console.error('❌ Error inserting data sources:', sourcesError);
      throw sourcesError;
    }

    console.log(`✅ Inserted ${sourcesData.length} data sources`);

    console.log('\n🎉 Mock data insertion completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Trending Topics: ${topicsData.length}`);
    console.log(`   - Generated Polls: ${pollsData.length}`);
    console.log(`   - Data Sources: ${sourcesData.length}`);
    console.log('\n🔗 You can now access the admin dashboard at: http://localhost:3001/admin');

  } catch (error) {
    console.error('❌ Mock data insertion failed:', error);
    process.exit(1);
  }
}

// Run the insertion
insertMockData();
