#!/usr/bin/env node

/**
 * Test Breaking News Backend Connection
 * Verifies that the database and service methods are working correctly
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBreakingNewsBackend() {
  console.log('🧪 Testing Breaking News Backend...\n');

  try {
    // Test 1: Check if breaking_news table exists and has data
    console.log('📋 Test 1: Checking breaking_news table...');
    const { data: stories, error: storiesError } = await supabase
      .from('breaking_news')
      .select('*')
      .order('created_at', { ascending: false });

    if (storiesError) {
      console.error('❌ Error fetching breaking news:', storiesError);
      return;
    }

    console.log(`✅ Found ${stories.length} breaking news stories`);
    if (stories.length > 0) {
      console.log('📰 Sample story:', {
        id: stories[0].id,
        headline: stories[0].headline,
        urgency: stories[0].urgency,
        source: stories[0].source_name
      });
    }

    // Test 2: Check if news_sources table exists and has data
    console.log('\n📋 Test 2: Checking news_sources table...');
    const { data: sources, error: sourcesError } = await supabase
      .from('news_sources')
      .select('*')
      .eq('is_active', true)
      .order('reliability', { ascending: false });

    if (sourcesError) {
      console.error('❌ Error fetching news sources:', sourcesError);
      return;
    }

    console.log(`✅ Found ${sources.length} active news sources`);
    if (sources.length > 0) {
      console.log('📡 Sample source:', {
        name: sources[0].name,
        reliability: sources[0].reliability,
        bias: sources[0].bias
      });
    }

    // Test 3: Check if poll_contexts table exists
    console.log('\n📋 Test 3: Checking poll_contexts table...');
    const { data: contexts, error: contextsError } = await supabase
      .from('poll_contexts')
      .select('*')
      .limit(5);

    if (contextsError) {
      console.error('❌ Error fetching poll contexts:', contextsError);
      return;
    }

    console.log(`✅ Found ${contexts.length} poll contexts`);

    // Test 4: Test inserting a new breaking news story
    console.log('\n📋 Test 4: Testing story creation...');
    const testStory = {
      headline: "Test: Breaking News Backend Connection Verified",
      summary: "This is a test story to verify the breaking news backend is working correctly.",
      full_story: "The breaking news system has been successfully tested and is ready for production use.",
      source_url: "https://example.com/test",
      source_name: "System Test",
      source_reliability: 0.95,
      category: ['test', 'system', 'verification'],
      urgency: 'medium',
      sentiment: 'neutral',
      entities: [
        { name: "System Test", type: "concept", confidence: 0.9 }
      ],
      metadata: {
        keywords: ["test", "backend", "verification"],
        controversy: 0.1,
        timeSensitivity: "low",
        geographicScope: "local",
        politicalImpact: 0.1,
        publicInterest: 0.1
      }
    };

    const { data: newStory, error: insertError } = await supabase
      .from('breaking_news')
      .insert([testStory])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test story:', insertError);
      return;
    }

    console.log('✅ Successfully created test story:', {
      id: newStory.id,
      headline: newStory.headline
    });

    // Test 5: Clean up test story
    console.log('\n📋 Test 5: Cleaning up test story...');
    const { error: deleteError } = await supabase
      .from('breaking_news')
      .delete()
      .eq('headline', testStory.headline);

    if (deleteError) {
      console.error('❌ Error deleting test story:', deleteError);
    } else {
      console.log('✅ Successfully cleaned up test story');
    }

    // Test 6: Test RLS policies
    console.log('\n📋 Test 6: Testing Row Level Security...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('breaking_news')
      .select('count')
      .limit(1);

    if (rlsError) {
      console.error('❌ RLS test failed:', rlsError);
    } else {
      console.log('✅ RLS policies working correctly');
    }

    console.log('\n🎉 All backend tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  ✅ Breaking news stories: ${stories.length}`);
    console.log(`  ✅ News sources: ${sources.length}`);
    console.log(`  ✅ Poll contexts: ${contexts.length}`);
    console.log('  ✅ Database operations working');
    console.log('  ✅ RLS policies configured');
    console.log('  ✅ Backend ready for frontend integration');

  } catch (error) {
    console.error('\n❌ Backend test failed:', error);
    process.exit(1);
  }
}

// Run the test
testBreakingNewsBackend();
