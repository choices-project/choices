#!/usr/bin/env node

/**
 * Fix Database Schema
 * 
 * This script drops and recreates the automated polls tables with the correct structure.
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

async function fixDatabaseSchema() {
  console.log('🔧 Fixing Database Schema...\n');

  try {
    // Drop existing tables if they exist
    console.log('🗑️ Dropping existing tables...');
    
    const dropSQL = `
      DROP TABLE IF EXISTS quality_metrics CASCADE;
      DROP TABLE IF EXISTS poll_generation_logs CASCADE;
      DROP TABLE IF EXISTS generated_polls CASCADE;
      DROP TABLE IF EXISTS data_sources CASCADE;
      DROP TABLE IF EXISTS trending_topics CASCADE;
      DROP TABLE IF EXISTS system_configuration CASCADE;
      DROP TABLE IF EXISTS feedback CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSQL });
    
    if (dropError) {
      console.error('❌ Error dropping tables:', dropError);
      throw dropError;
    }

    console.log('✅ Tables dropped successfully');

    // Create tables with correct schema
    console.log('\n📋 Creating tables with correct schema...');
    
    const createSQL = `
      -- ============================================================================
      -- TRENDING TOPICS TABLE
      -- ============================================================================

      CREATE TABLE trending_topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        source_url TEXT,
        source_name TEXT NOT NULL,
        source_type TEXT NOT NULL CHECK (source_type IN ('news', 'social', 'search', 'academic')),
        category TEXT[] DEFAULT '{}',
        trending_score DECIMAL(5,2) DEFAULT 0.0,
        velocity DECIMAL(5,2) DEFAULT 0.0,
        momentum DECIMAL(5,2) DEFAULT 0.0,
        sentiment_score DECIMAL(3,2) DEFAULT 0.0,
        entities JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
        analysis_data JSONB DEFAULT '{}',
        last_processed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ============================================================================
      -- GENERATED POLLS TABLE
      -- ============================================================================

      CREATE TABLE generated_polls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic_id UUID REFERENCES trending_topics(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        options JSONB NOT NULL,
        voting_method TEXT NOT NULL CHECK (voting_method IN ('single', 'multiple', 'ranked', 'approval', 'range', 'quadratic')),
        category TEXT,
        tags TEXT[] DEFAULT '{}',
        quality_score DECIMAL(3,2) DEFAULT 0.0,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'active', 'closed')),
        approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP WITH TIME ZONE,
        topic_analysis JSONB DEFAULT '{}',
        quality_metrics JSONB DEFAULT '{}',
        generation_metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ============================================================================
      -- DATA SOURCES TABLE
      -- ============================================================================

      CREATE TABLE data_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK (type IN ('news', 'social', 'search', 'academic')),
        api_endpoint TEXT,
        api_key TEXT,
        rate_limit INTEGER DEFAULT 1000,
        reliability DECIMAL(3,2) DEFAULT 0.9,
        is_active BOOLEAN DEFAULT TRUE,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        error_count INTEGER DEFAULT 0,
        success_rate DECIMAL(5,2) DEFAULT 100.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ============================================================================
      -- POLL GENERATION LOGS TABLE
      -- ============================================================================

      CREATE TABLE poll_generation_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic_id UUID REFERENCES trending_topics(id) ON DELETE CASCADE,
        poll_id UUID REFERENCES generated_polls(id) ON DELETE CASCADE,
        generation_step TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
        error_message TEXT,
        processing_time_ms INTEGER,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ============================================================================
      -- QUALITY METRICS TABLE
      -- ============================================================================

      CREATE TABLE quality_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        poll_id UUID REFERENCES generated_polls(id) ON DELETE CASCADE,
        bias_score DECIMAL(3,2) DEFAULT 0.0,
        clarity_score DECIMAL(3,2) DEFAULT 0.0,
        completeness_score DECIMAL(3,2) DEFAULT 0.0,
        relevance_score DECIMAL(3,2) DEFAULT 0.0,
        controversy_score DECIMAL(3,2) DEFAULT 0.0,
        overall_score DECIMAL(3,2) DEFAULT 0.0,
        assessment_metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ============================================================================
      -- SYSTEM CONFIGURATION TABLE
      -- ============================================================================

      CREATE TABLE system_configuration (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT NOT NULL UNIQUE,
        value JSONB NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ============================================================================
      -- FEEDBACK TABLE
      -- ============================================================================

      CREATE TABLE feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        poll_id UUID REFERENCES generated_polls(id) ON DELETE CASCADE,
        topic_id UUID REFERENCES trending_topics(id) ON DELETE CASCADE,
        feedback_type TEXT NOT NULL CHECK (feedback_type IN ('quality', 'relevance', 'bias', 'clarity', 'other')),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- ============================================================================
      -- AUDIT LOGS TABLE
      -- ============================================================================

      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        table_name TEXT,
        record_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createSQL });
    
    if (createError) {
      console.error('❌ Error creating tables:', createError);
      throw createError;
    }

    console.log('✅ Tables created successfully');

    // Create indexes
    console.log('\n📊 Creating indexes...');
    
    const indexSQL = `
      -- Trending topics indexes
      CREATE INDEX IF NOT EXISTS idx_trending_topics_processing_status ON trending_topics(processing_status);
      CREATE INDEX IF NOT EXISTS idx_trending_topics_trending_score ON trending_topics(trending_score DESC);
      CREATE INDEX IF NOT EXISTS idx_trending_topics_created_at ON trending_topics(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_trending_topics_category ON trending_topics USING GIN(category);

      -- Generated polls indexes
      CREATE INDEX IF NOT EXISTS idx_generated_polls_status ON generated_polls(status);
      CREATE INDEX IF NOT EXISTS idx_generated_polls_topic_id ON generated_polls(topic_id);
      CREATE INDEX IF NOT EXISTS idx_generated_polls_created_at ON generated_polls(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_generated_polls_quality_score ON generated_polls(quality_score DESC);

      -- Data sources indexes
      CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
      CREATE INDEX IF NOT EXISTS idx_data_sources_is_active ON data_sources(is_active);

      -- Quality metrics indexes
      CREATE INDEX IF NOT EXISTS idx_quality_metrics_poll_id ON quality_metrics(poll_id);
      CREATE INDEX IF NOT EXISTS idx_quality_metrics_overall_score ON quality_metrics(overall_score DESC);

      -- Feedback indexes
      CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_poll_id ON feedback(poll_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_feedback_type ON feedback(feedback_type);

      -- Audit logs indexes
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
      throw indexError;
    }

    console.log('✅ Indexes created successfully');

    console.log('\n🎉 Database schema fixed successfully!');
    console.log('\n📋 Tables created:');
    console.log('   - trending_topics');
    console.log('   - generated_polls');
    console.log('   - data_sources');
    console.log('   - poll_generation_logs');
    console.log('   - quality_metrics');
    console.log('   - system_configuration');
    console.log('   - feedback');
    console.log('   - audit_logs');

  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixDatabaseSchema();
