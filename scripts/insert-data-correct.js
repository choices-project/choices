#!/usr/bin/env node

/**
 * Insert Mock Data with Correct Column Names
 * 
 * This script inserts mock data using the correct column names from the schema.
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

async function insertData() {
  console.log('🚀 Inserting Mock Data with Correct Columns...\n');

  try {
    // Insert trending topics with correct column names
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
        processing_status: 'pending',
        analysis_data: {}
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
        processing_status: 'rejected',
        analysis_data: {}
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
        processing_status: 'approved',
        analysis_data: {}
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
        processing_status: 'pending',
        analysis_data: {}
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
        processing_status: 'pending',
        analysis_data: {}
      }
    ];

    // Try inserting one topic first to see what error we get
    console.log('Testing with one topic first...');
    const { data: testData, error: testError } = await supabase
      .from('trending_topics')
      .insert(mockTopics[0])
      .select();

    if (testError) {
      console.error('❌ Error with test insert:', testError);
      
      // Try with minimal data to see what columns exist
      console.log('Trying minimal insert...');
      const minimalTopic = {
        title: 'Test Topic',
        source_name: 'Test Source',
        source_type: 'news'
      };
      
      const { data: minimalData, error: minimalError } = await supabase
        .from('trending_topics')
        .insert(minimalTopic)
        .select();
      
      if (minimalError) {
        console.error('❌ Error with minimal insert:', minimalError);
      } else {
        console.log('✅ Minimal insert successful:', minimalData);
        
        // Now try the full insert
        console.log('Trying full insert...');
        const { data: topicsData, error: topicsError } = await supabase
          .from('trending_topics')
          .insert(mockTopics)
          .select();

        if (topicsError) {
          console.error('❌ Error inserting trending topics:', topicsError);
          throw topicsError;
        }

        console.log(`✅ Inserted ${topicsData.length} trending topics`);
      }
    } else {
      console.log('✅ Test insert successful:', testData);
      
      // Now try the full insert
      console.log('Trying full insert...');
      const { data: topicsData, error: topicsError } = await supabase
        .from('trending_topics')
        .insert(mockTopics)
        .select();

      if (topicsError) {
        console.error('❌ Error inserting trending topics:', topicsError);
        throw topicsError;
      }

      console.log(`✅ Inserted ${topicsData.length} trending topics`);
    }

    console.log('\n🎉 Data insertion completed successfully!');
    console.log('\n🔗 You can now access the admin dashboard at: http://localhost:3001/admin');

  } catch (error) {
    console.error('❌ Data insertion failed:', error);
    process.exit(1);
  }
}

// Run the insertion
insertData();
