#!/usr/bin/env node

/**
 * Deploy Breaking News Database Schema
 * Creates tables for real-time news gathering and breaking news stories
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployBreakingNewsDatabase() {
  console.log('🚀 Deploying Breaking News Database Schema...\n');

  try {
    // Create breaking_news table
    console.log('📋 Creating breaking_news table...');
    const breakingNewsSQL = `
      CREATE TABLE IF NOT EXISTS breaking_news (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        headline TEXT NOT NULL,
        summary TEXT NOT NULL,
        full_story TEXT,
        source_url TEXT,
        source_name TEXT NOT NULL,
        source_reliability DECIMAL(3,2) DEFAULT 0.9,
        category TEXT[] DEFAULT '{}',
        urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'breaking')),
        sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
        entities JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_breaking_news_urgency ON breaking_news(urgency);
      CREATE INDEX IF NOT EXISTS idx_breaking_news_category ON breaking_news USING GIN(category);
      CREATE INDEX IF NOT EXISTS idx_breaking_news_created_at ON breaking_news(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_breaking_news_source_reliability ON breaking_news(source_reliability DESC);
    `;

    const { error: breakingNewsError } = await supabase.rpc('exec_sql', { sql: breakingNewsSQL });
    if (breakingNewsError) {
      console.error('❌ Error creating breaking_news table:', breakingNewsError);
      throw breakingNewsError;
    }
    console.log('✅ breaking_news table created successfully');

    // Create news_sources table
    console.log('\n📋 Creating news_sources table...');
    const newsSourcesSQL = `
      CREATE TABLE IF NOT EXISTS news_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        domain TEXT NOT NULL,
        reliability DECIMAL(3,2) DEFAULT 0.9,
        bias TEXT DEFAULT 'unknown' CHECK (bias IN ('left', 'center-left', 'center', 'center-right', 'right', 'unknown')),
        type TEXT DEFAULT 'mainstream' CHECK (type IN ('mainstream', 'wire', 'digital', 'international')),
        api_endpoint TEXT,
        api_key TEXT,
        rate_limit INTEGER DEFAULT 1000,
        is_active BOOLEAN DEFAULT TRUE,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        error_count INTEGER DEFAULT 0,
        success_rate DECIMAL(5,2) DEFAULT 100.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_news_sources_reliability ON news_sources(reliability DESC);
      CREATE INDEX IF NOT EXISTS idx_news_sources_is_active ON news_sources(is_active);
      CREATE INDEX IF NOT EXISTS idx_news_sources_type ON news_sources(type);
    `;

    const { error: newsSourcesError } = await supabase.rpc('exec_sql', { sql: newsSourcesSQL });
    if (newsSourcesError) {
      console.error('❌ Error creating news_sources table:', newsSourcesError);
      throw newsSourcesError;
    }
    console.log('✅ news_sources table created successfully');

    // Create poll_contexts table
    console.log('\n📋 Creating poll_contexts table...');
    const pollContextsSQL = `
      CREATE TABLE IF NOT EXISTS poll_contexts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        story_id UUID REFERENCES breaking_news(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        context TEXT NOT NULL,
        why_important TEXT NOT NULL,
        stakeholders JSONB DEFAULT '{}',
        options JSONB NOT NULL,
        voting_method TEXT NOT NULL CHECK (voting_method IN ('single', 'multiple', 'ranked', 'approval', 'range')),
        estimated_controversy DECIMAL(3,2) DEFAULT 0.5,
        time_to_live INTEGER DEFAULT 24, -- hours
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'archived')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_poll_contexts_story_id ON poll_contexts(story_id);
      CREATE INDEX IF NOT EXISTS idx_poll_contexts_status ON poll_contexts(status);
      CREATE INDEX IF NOT EXISTS idx_poll_contexts_created_at ON poll_contexts(created_at DESC);
    `;

    const { error: pollContextsError } = await supabase.rpc('exec_sql', { sql: pollContextsSQL });
    if (pollContextsError) {
      console.error('❌ Error creating poll_contexts table:', pollContextsError);
      throw pollContextsError;
    }
    console.log('✅ poll_contexts table created successfully');

    // Create news_fetch_logs table for tracking data gathering
    console.log('\n📋 Creating news_fetch_logs table...');
    const newsFetchLogsSQL = `
      CREATE TABLE IF NOT EXISTS news_fetch_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id UUID REFERENCES news_sources(id) ON DELETE SET NULL,
        fetch_type TEXT NOT NULL CHECK (fetch_type IN ('manual', 'scheduled', 'real_time')),
        status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'partial')),
        articles_found INTEGER DEFAULT 0,
        articles_processed INTEGER DEFAULT 0,
        error_message TEXT,
        processing_time_ms INTEGER,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_news_fetch_logs_source_id ON news_fetch_logs(source_id);
      CREATE INDEX IF NOT EXISTS idx_news_fetch_logs_status ON news_fetch_logs(status);
      CREATE INDEX IF NOT EXISTS idx_news_fetch_logs_created_at ON news_fetch_logs(created_at DESC);
    `;

    const { error: newsFetchLogsError } = await supabase.rpc('exec_sql', { sql: newsFetchLogsSQL });
    if (newsFetchLogsError) {
      console.error('❌ Error creating news_fetch_logs table:', newsFetchLogsError);
      throw newsFetchLogsError;
    }
    console.log('✅ news_fetch_logs table created successfully');

    // Insert default news sources
    console.log('\n📋 Inserting default news sources...');
    const defaultSources = [
      {
        name: 'Reuters',
        domain: 'reuters.com',
        reliability: 0.95,
        bias: 'center',
        type: 'mainstream',
        api_endpoint: 'https://newsapi.org/v2/everything',
        rate_limit: 1000
      },
      {
        name: 'Associated Press',
        domain: 'ap.org',
        reliability: 0.94,
        bias: 'center',
        type: 'wire',
        api_endpoint: 'https://newsapi.org/v2/everything',
        rate_limit: 1000
      },
      {
        name: 'BBC News',
        domain: 'bbc.com',
        reliability: 0.92,
        bias: 'center-left',
        type: 'mainstream',
        api_endpoint: 'https://newsapi.org/v2/everything',
        rate_limit: 1000
      },
      {
        name: 'CNN',
        domain: 'cnn.com',
        reliability: 0.88,
        bias: 'center-left',
        type: 'mainstream',
        api_endpoint: 'https://newsapi.org/v2/everything',
        rate_limit: 1000
      },
      {
        name: 'Fox News',
        domain: 'foxnews.com',
        reliability: 0.85,
        bias: 'center-right',
        type: 'mainstream',
        api_endpoint: 'https://newsapi.org/v2/everything',
        rate_limit: 1000
      },
      {
        name: 'NPR',
        domain: 'npr.org',
        reliability: 0.90,
        bias: 'center-left',
        type: 'mainstream',
        api_endpoint: 'https://newsapi.org/v2/everything',
        rate_limit: 1000
      },
      {
        name: 'Politico',
        domain: 'politico.com',
        reliability: 0.87,
        bias: 'center',
        type: 'digital',
        api_endpoint: 'https://newsapi.org/v2/everything',
        rate_limit: 1000
      }
    ];

    for (const source of defaultSources) {
      const { error: insertError } = await supabase
        .from('news_sources')
        .upsert(source, { onConflict: 'name' });

      if (insertError) {
        console.error(`❌ Error inserting source ${source.name}:`, insertError);
      } else {
        console.log(`✅ Inserted/updated source: ${source.name}`);
      }
    }

    // Insert test breaking news stories (Gavin Newsom vs Trump)
    console.log('\n📋 Inserting test breaking news stories...');
    const testStories = [
      {
        headline: "Gavin Newsom Challenges Trump to Presidential Debate",
        summary: "California Governor Gavin Newsom has publicly challenged former President Donald Trump to a one-on-one presidential debate, escalating their ongoing political feud ahead of the 2024 election cycle.",
        full_story: "California Governor Gavin Newsom has issued a direct challenge to former President Donald Trump for a presidential debate, marking a significant escalation in their ongoing political rivalry. The challenge comes as both political figures position themselves for potential 2024 presidential campaigns.",
        source_url: "https://example.com/news/politics/newsom-trump-debate-challenge",
        source_name: "Political Analysis",
        source_reliability: 0.92,
        category: ['politics', 'election', 'presidential', 'debate'],
        urgency: 'high',
        sentiment: 'mixed',
        entities: [
          { name: "Gavin Newsom", type: "person", confidence: 0.98, role: "California Governor" },
          { name: "Donald Trump", type: "person", confidence: 0.98, role: "Former President" },
          { name: "2024 Election", type: "event", confidence: 0.95 }
        ],
        metadata: {
          keywords: ["newsom", "trump", "debate", "election", "presidential"],
          controversy: 0.85,
          timeSensitivity: "high",
          geographicScope: "national",
          politicalImpact: 0.90,
          publicInterest: 0.88
        }
      },
      {
        headline: "Newsom's California Policies Face Trump's 'America First' Criticism",
        summary: "Former President Trump has intensified his criticism of Governor Newsom's California policies, calling them 'failed experiments' while Newsom defends his progressive governance approach.",
        full_story: "Former President Donald Trump has launched a new round of criticism against California Governor Gavin Newsom's policies, calling the state's progressive governance approach 'failed experiments' that shouldn't be replicated nationally.",
        source_url: "https://example.com/news/politics/california-policies-debate",
        source_name: "Policy Analysis",
        source_reliability: 0.89,
        category: ['politics', 'policy', 'governance', 'california'],
        urgency: 'medium',
        sentiment: 'negative',
        entities: [
          { name: "Gavin Newsom", type: "person", confidence: 0.95, role: "California Governor" },
          { name: "Donald Trump", type: "person", confidence: 0.95, role: "Former President" },
          { name: "California", type: "location", confidence: 0.92 }
        ],
        metadata: {
          keywords: ["california", "policies", "progressive", "conservative", "governance"],
          controversy: 0.75,
          timeSensitivity: "medium",
          geographicScope: "national",
          politicalImpact: 0.80,
          publicInterest: 0.75
        }
      }
    ];

    for (const story of testStories) {
      const { error: insertError } = await supabase
        .from('breaking_news')
        .insert(story);

      if (insertError) {
        console.error(`❌ Error inserting story "${story.headline}":`, insertError);
      } else {
        console.log(`✅ Inserted story: ${story.headline}`);
      }
    }

    // Set up Row Level Security (RLS)
    console.log('\n🔒 Setting up Row Level Security...');
    const rlsSQL = `
      -- Enable RLS on all tables
      ALTER TABLE breaking_news ENABLE ROW LEVEL SECURITY;
      ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
      ALTER TABLE poll_contexts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE news_fetch_logs ENABLE ROW LEVEL SECURITY;

      -- Breaking news policies (read-only for public, full access for admins)
      CREATE POLICY "breaking_news_select_policy" ON breaking_news
        FOR SELECT USING (true);

      CREATE POLICY "breaking_news_insert_policy" ON breaking_news
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid() 
            AND verification_tier IN ('T2', 'T3')
          )
        );

      CREATE POLICY "breaking_news_update_policy" ON breaking_news
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid() 
            AND verification_tier IN ('T2', 'T3')
          )
        );

      -- News sources policies (admin only)
      CREATE POLICY "news_sources_select_policy" ON news_sources
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid() 
            AND verification_tier IN ('T2', 'T3')
          )
        );

      CREATE POLICY "news_sources_insert_policy" ON news_sources
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid() 
            AND verification_tier IN ('T2', 'T3')
          )
        );

      CREATE POLICY "news_sources_update_policy" ON news_sources
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid() 
            AND verification_tier IN ('T2', 'T3')
          )
        );

      -- Poll contexts policies
      CREATE POLICY "poll_contexts_select_policy" ON poll_contexts
        FOR SELECT USING (true);

      CREATE POLICY "poll_contexts_insert_policy" ON poll_contexts
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid() 
            AND verification_tier IN ('T2', 'T3')
          )
        );

      CREATE POLICY "poll_contexts_update_policy" ON poll_contexts
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid() 
            AND verification_tier IN ('T2', 'T3')
          )
        );

      -- News fetch logs policies (admin only)
      CREATE POLICY "news_fetch_logs_select_policy" ON news_fetch_logs
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid() 
            AND verification_tier IN ('T2', 'T3')
          )
        );

      CREATE POLICY "news_fetch_logs_insert_policy" ON news_fetch_logs
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid() 
            AND verification_tier IN ('T2', 'T3')
          )
        );
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) {
      console.error('❌ Error setting up RLS:', rlsError);
      throw rlsError;
    }
    console.log('✅ Row Level Security configured successfully');

    console.log('\n🎉 Breaking News Database deployment completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ breaking_news table created');
    console.log('  ✅ news_sources table created');
    console.log('  ✅ poll_contexts table created');
    console.log('  ✅ news_fetch_logs table created');
    console.log('  ✅ Default news sources inserted');
    console.log('  ✅ Test breaking news stories inserted');
    console.log('  ✅ Row Level Security configured');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run the deployment
deployBreakingNewsDatabase();
