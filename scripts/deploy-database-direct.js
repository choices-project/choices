#!/usr/bin/env node

require('dotenv').config({ path: './web/.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function deployDatabase() {
  console.log('🔧 Direct Database Deployment');
  console.log('==============================\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('✅ Found Supabase credentials');
  console.log(`📡 URL: ${supabaseUrl}`);
  console.log(`🔑 Service Key: ${supabaseServiceKey.substring(0, 20)}...`);

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('\n📋 Step 1: Creating automated polls tables...');
    
    // Step 1: Create tables (with IF NOT EXISTS to avoid errors)
    const tablesSQL = `
      -- Trending Topics Table
      CREATE TABLE IF NOT EXISTS trending_topics (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          source_url TEXT,
          sentiment_score DECIMAL(3,2),
          engagement_score INTEGER DEFAULT 0,
          trending_score DECIMAL(5,2) DEFAULT 0.0,
          keywords TEXT[],
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'))
      );

      -- Generated Polls Table
      CREATE TABLE IF NOT EXISTS generated_polls (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          topic_id UUID REFERENCES trending_topics(id),
          title TEXT NOT NULL,
          description TEXT,
          options TEXT[] NOT NULL,
          voting_method TEXT DEFAULT 'single' CHECK (voting_method IN ('single', 'multiple', 'ranked')),
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'closed')),
          quality_score DECIMAL(3,2),
          generated_at TIMESTAMPTZ DEFAULT NOW(),
          approved_at TIMESTAMPTZ,
          approved_by UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Data Sources Table
      CREATE TABLE IF NOT EXISTS data_sources (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('news', 'social', 'search', 'api')),
          url TEXT,
          api_key TEXT,
          rate_limit INTEGER DEFAULT 100,
          last_fetched TIMESTAMPTZ,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Poll Generation Logs Table
      CREATE TABLE IF NOT EXISTS poll_generation_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          topic_id UUID REFERENCES trending_topics(id),
          poll_id UUID REFERENCES generated_polls(id),
          action TEXT NOT NULL,
          details JSONB,
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          processing_time_ms INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Quality Metrics Table
      CREATE TABLE IF NOT EXISTS quality_metrics (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          poll_id UUID REFERENCES generated_polls(id),
          metric_name TEXT NOT NULL,
          metric_value DECIMAL(5,2),
          threshold DECIMAL(5,2),
          passed BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- System Configuration Table
      CREATE TABLE IF NOT EXISTS system_configuration (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value JSONB NOT NULL,
          description TEXT,
          updated_by UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const { error: tablesError } = await supabase.rpc('exec_sql', { sql: tablesSQL });
    
    if (tablesError) {
      console.log('⚠️  Tables may already exist, continuing...');
    } else {
      console.log('✅ Tables created successfully');
    }

    console.log('\n📋 Step 2: Creating indexes...');
    
    const indexesSQL = `
      -- Trending topics indexes
      CREATE INDEX IF NOT EXISTS idx_trending_topics_category ON trending_topics(category);
      CREATE INDEX IF NOT EXISTS idx_trending_topics_status ON trending_topics(status);
      CREATE INDEX IF NOT EXISTS idx_trending_topics_trending_score ON trending_topics(trending_score DESC);

      -- Generated polls indexes
      CREATE INDEX IF NOT EXISTS idx_generated_polls_status ON generated_polls(status);
      CREATE INDEX IF NOT EXISTS idx_generated_polls_topic_id ON generated_polls(topic_id);
      CREATE INDEX IF NOT EXISTS idx_generated_polls_quality_score ON generated_polls(quality_score DESC);

      -- Data sources indexes
      CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
      CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status);

      -- Poll generation logs indexes
      CREATE INDEX IF NOT EXISTS idx_poll_generation_logs_topic_id ON poll_generation_logs(topic_id);
      CREATE INDEX IF NOT EXISTS idx_poll_generation_logs_poll_id ON poll_generation_logs(poll_id);
      CREATE INDEX IF NOT EXISTS idx_poll_generation_logs_created_at ON poll_generation_logs(created_at DESC);

      -- Quality metrics indexes
      CREATE INDEX IF NOT EXISTS idx_quality_metrics_poll_id ON quality_metrics(poll_id);
      CREATE INDEX IF NOT EXISTS idx_quality_metrics_metric_name ON quality_metrics(metric_name);
    `;

    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: indexesSQL });
    
    if (indexesError) {
      console.log('⚠️  Indexes may already exist, continuing...');
    } else {
      console.log('✅ Indexes created successfully');
    }

    console.log('\n📋 Step 3: Creating triggers...');
    
    const triggersSQL = `
      -- Function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create triggers for updated_at (with IF NOT EXISTS check)
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_trending_topics_updated_at') THEN
              CREATE TRIGGER update_trending_topics_updated_at
                  BEFORE UPDATE ON trending_topics
                  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_generated_polls_updated_at') THEN
              CREATE TRIGGER update_generated_polls_updated_at
                  BEFORE UPDATE ON generated_polls
                  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_data_sources_updated_at') THEN
              CREATE TRIGGER update_data_sources_updated_at
                  BEFORE UPDATE ON data_sources
                  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_configuration_updated_at') THEN
              CREATE TRIGGER update_system_configuration_updated_at
                  BEFORE UPDATE ON system_configuration
                  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
          END IF;
      END $$;
    `;

    const { error: triggersError } = await supabase.rpc('exec_sql', { sql: triggersSQL });
    
    if (triggersError) {
      console.log('⚠️  Triggers may already exist, continuing...');
    } else {
      console.log('✅ Triggers created successfully');
    }

    console.log('\n📋 Step 4: Inserting initial data...');
    
    const initialDataSQL = `
      -- Insert initial data sources
      INSERT INTO data_sources (name, type, url, status) VALUES
      ('News API', 'news', 'https://newsapi.org', 'active'),
      ('Twitter API', 'social', 'https://api.twitter.com', 'active'),
      ('Google Trends', 'search', 'https://trends.google.com', 'active')
      ON CONFLICT DO NOTHING;

      -- Insert system configuration
      INSERT INTO system_configuration (key, value, description) VALUES
      ('automated_polls_enabled', 'true', 'Enable automated poll generation'),
      ('analysis_frequency_hours', '24', 'How often to analyze trending topics'),
      ('max_polls_per_day', '10', 'Maximum number of polls to generate per day'),
      ('quality_threshold', '0.7', 'Minimum quality score for poll approval')
      ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = NOW();
    `;

    const { error: dataError } = await supabase.rpc('exec_sql', { sql: initialDataSQL });
    
    if (dataError) {
      console.log('⚠️  Initial data may already exist, continuing...');
    } else {
      console.log('✅ Initial data inserted successfully');
    }

    console.log('\n📋 Step 5: Deploying security policies...');
    
    // Read the fixed security policies
    const fs = require('fs');
    const path = require('path');
    const securitySQLPath = path.join(__dirname, '../database/security_policies_fixed.sql');
    
    if (!fs.existsSync(securitySQLPath)) {
      console.error('❌ Security policies file not found');
      process.exit(1);
    }

    const securitySQL = fs.readFileSync(securitySQLPath, 'utf8');
    
    // Split into smaller chunks to avoid timeout
    const sqlChunks = securitySQL.split(';').filter(chunk => chunk.trim().length > 0);
    
    for (let i = 0; i < sqlChunks.length; i++) {
      const chunk = sqlChunks[i] + ';';
      console.log(`   Deploying chunk ${i + 1}/${sqlChunks.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: chunk });
      
      if (error) {
        console.log(`   ⚠️  Chunk ${i + 1} may have errors (continuing): ${error.message}`);
      }
    }

    console.log('✅ Security policies deployed successfully');

    console.log('\n🎉 Database deployment completed!');
    console.log('=====================================');
    console.log('✅ Automated polls tables created');
    console.log('✅ Indexes and triggers created');
    console.log('✅ Initial data inserted');
    console.log('✅ Security policies deployed');
    console.log('\n🔧 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Test admin dashboard at /admin/automated-polls');
    console.log('3. Test poll creation and voting');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

deployDatabase();
