#!/usr/bin/env node

/**
 * Trust Tier Analysis System
 * 
 * This script creates a sophisticated system for:
 * 1. Bot detection via trust tier analysis
 * 2. Narrative analysis comparing different user tiers
 * 3. Propaganda detection through sentiment differences
 * 4. Trust-weighted voting and polling
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTrustTierAnalysisTables() {
  console.log('🚀 Creating trust tier analysis tables...');
  
  const results = {
    tablesCreated: 0,
    tablesFailed: 0,
    errors: []
  };

  // Define trust tier analysis tables
  const analysisTables = [
    {
      name: 'trust_tier_analytics',
      sql: `
        CREATE TABLE IF NOT EXISTS trust_tier_analytics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES user_profiles(id),
          trust_tier INTEGER NOT NULL,
          analysis_type VARCHAR(50) NOT NULL, -- 'bot_detection', 'narrative_analysis', 'sentiment_analysis'
          content_id UUID, -- poll_id, representative_id, etc.
          content_type VARCHAR(50), -- 'poll', 'representative', 'hashtag'
          analysis_data JSONB NOT NULL,
          confidence_score DECIMAL(3,2), -- 0.00 to 1.00
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'narrative_analysis_results',
      sql: `
        CREATE TABLE IF NOT EXISTS narrative_analysis_results (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          content_id UUID NOT NULL,
          content_type VARCHAR(50) NOT NULL,
          analysis_period VARCHAR(20) NOT NULL, -- 'hourly', 'daily', 'weekly'
          tier_1_sentiment DECIMAL(3,2), -- Verified users sentiment
          tier_2_sentiment DECIMAL(3,2), -- Established users sentiment
          tier_3_sentiment DECIMAL(3,2), -- New users sentiment
          anonymous_sentiment DECIMAL(3,2), -- Anonymous users sentiment
          bot_detection_score DECIMAL(3,2), -- 0.00 to 1.00
          narrative_divergence DECIMAL(3,2), -- How much tiers differ
          propaganda_indicators JSONB, -- Flags for potential propaganda
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'trust_weighted_votes',
      sql: `
        CREATE TABLE IF NOT EXISTS trust_weighted_votes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          poll_id UUID REFERENCES polls(id),
          user_id UUID REFERENCES user_profiles(id),
          trust_tier INTEGER NOT NULL,
          trust_weight DECIMAL(3,2) NOT NULL, -- Weight based on trust tier
          vote_value DECIMAL(3,2) NOT NULL, -- Actual vote value
          weighted_vote DECIMAL(5,2) NOT NULL, -- vote_value * trust_weight
          is_anonymous BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'bot_detection_logs',
      sql: `
        CREATE TABLE IF NOT EXISTS bot_detection_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES user_profiles(id),
          detection_type VARCHAR(50) NOT NULL, -- 'behavioral', 'temporal', 'network'
          detection_score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
          detection_reasons JSONB NOT NULL, -- Array of reasons
          is_confirmed_bot BOOLEAN DEFAULT FALSE,
          human_reviewed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }
  ];

  // Create tables
  for (const table of analysisTables) {
    try {
      console.log(`📋 Creating table: ${table.name}`);
      
      const { error } = await supabase
        .rpc('exec_sql', { sql: table.sql });

      if (error) {
        console.error(`❌ Error creating table ${table.name}:`, error);
        results.tablesFailed++;
        results.errors.push(`Failed to create table ${table.name}: ${error.message}`);
      } else {
        console.log(`✅ Table created: ${table.name}`);
        results.tablesCreated++;
      }
    } catch (error) {
      console.error(`❌ Error creating table ${table.name}:`, error);
      results.tablesFailed++;
      results.errors.push(`Error creating table ${table.name}: ${error.message}`);
    }
  }

  return results;
}

async function createTrustTierAnalysisFunctions() {
  console.log('🔧 Creating trust tier analysis functions...');
  
  const results = {
    functionsCreated: 0,
    functionsFailed: 0,
    errors: []
  };

  // Define analysis functions
  const analysisFunctions = [
    {
      name: 'analyze_narrative_divergence',
      sql: `
        CREATE OR REPLACE FUNCTION analyze_narrative_divergence(
          p_content_id UUID,
          p_content_type VARCHAR(50),
          p_analysis_period VARCHAR(20) DEFAULT 'daily'
        )
        RETURNS JSONB AS $$
        DECLARE
          tier_1_sentiment DECIMAL(3,2);
          tier_2_sentiment DECIMAL(3,2);
          tier_3_sentiment DECIMAL(3,2);
          anonymous_sentiment DECIMAL(3,2);
          narrative_divergence DECIMAL(3,2);
          bot_detection_score DECIMAL(3,2);
          propaganda_indicators JSONB;
        BEGIN
          -- Calculate sentiment for each tier
          SELECT AVG(sentiment_score) INTO tier_1_sentiment
          FROM trust_tier_analytics
          WHERE content_id = p_content_id
            AND content_type = p_content_type
            AND trust_tier = 1
            AND analysis_type = 'sentiment_analysis'
            AND created_at >= NOW() - INTERVAL '1 ' || p_analysis_period;
          
          SELECT AVG(sentiment_score) INTO tier_2_sentiment
          FROM trust_tier_analytics
          WHERE content_id = p_content_id
            AND content_type = p_content_type
            AND trust_tier = 2
            AND analysis_type = 'sentiment_analysis'
            AND created_at >= NOW() - INTERVAL '1 ' || p_analysis_period;
          
          SELECT AVG(sentiment_score) INTO tier_3_sentiment
          FROM trust_tier_analytics
          WHERE content_id = p_content_id
            AND content_type = p_content_type
            AND trust_tier = 3
            AND analysis_type = 'sentiment_analysis'
            AND created_at >= NOW() - INTERVAL '1 ' || p_analysis_period;
          
          SELECT AVG(sentiment_score) INTO anonymous_sentiment
          FROM trust_tier_analytics
          WHERE content_id = p_content_id
            AND content_type = p_content_type
            AND trust_tier = 0
            AND analysis_type = 'sentiment_analysis'
            AND created_at >= NOW() - INTERVAL '1 ' || p_analysis_period;
          
          -- Calculate narrative divergence
          narrative_divergence := GREATEST(
            ABS(tier_1_sentiment - tier_2_sentiment),
            ABS(tier_1_sentiment - tier_3_sentiment),
            ABS(tier_1_sentiment - anonymous_sentiment),
            ABS(tier_2_sentiment - tier_3_sentiment),
            ABS(tier_2_sentiment - anonymous_sentiment),
            ABS(tier_3_sentiment - anonymous_sentiment)
          );
          
          -- Calculate bot detection score
          bot_detection_score := CASE
            WHEN narrative_divergence > 0.7 THEN 0.9
            WHEN narrative_divergence > 0.5 THEN 0.7
            WHEN narrative_divergence > 0.3 THEN 0.5
            ELSE 0.2
          END;
          
          -- Generate propaganda indicators
          propaganda_indicators := jsonb_build_object(
            'high_divergence', narrative_divergence > 0.7,
            'anonymous_bias', ABS(anonymous_sentiment - tier_1_sentiment) > 0.5,
            'new_user_bias', ABS(tier_3_sentiment - tier_1_sentiment) > 0.5,
            'coordinated_activity', narrative_divergence > 0.8,
            'bot_likelihood', bot_detection_score
          );
          
          RETURN jsonb_build_object(
            'tier_1_sentiment', tier_1_sentiment,
            'tier_2_sentiment', tier_2_sentiment,
            'tier_3_sentiment', tier_3_sentiment,
            'anonymous_sentiment', anonymous_sentiment,
            'narrative_divergence', narrative_divergence,
            'bot_detection_score', bot_detection_score,
            'propaganda_indicators', propaganda_indicators
          );
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'calculate_trust_weighted_votes',
      sql: `
        CREATE OR REPLACE FUNCTION calculate_trust_weighted_votes(
          p_poll_id UUID
        )
        RETURNS JSONB AS $$
        DECLARE
          tier_1_weight DECIMAL(3,2) := 1.0;
          tier_2_weight DECIMAL(3,2) := 0.8;
          tier_3_weight DECIMAL(3,2) := 0.6;
          anonymous_weight DECIMAL(3,2) := 0.3;
          result JSONB;
        BEGIN
          WITH weighted_votes AS (
            SELECT 
              option_id,
              SUM(CASE 
                WHEN trust_tier = 1 THEN vote_value * tier_1_weight
                WHEN trust_tier = 2 THEN vote_value * tier_2_weight
                WHEN trust_tier = 3 THEN vote_value * tier_3_weight
                ELSE vote_value * anonymous_weight
              END) as weighted_total,
              COUNT(*) as vote_count,
              AVG(trust_weight) as avg_trust_weight
            FROM trust_weighted_votes
            WHERE poll_id = p_poll_id
            GROUP BY option_id
          )
          SELECT jsonb_agg(
            jsonb_build_object(
              'option_id', option_id,
              'weighted_total', weighted_total,
              'vote_count', vote_count,
              'avg_trust_weight', avg_trust_weight
            )
          ) INTO result
          FROM weighted_votes;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'detect_bot_behavior',
      sql: `
        CREATE OR REPLACE FUNCTION detect_bot_behavior(
          p_user_id UUID
        )
        RETURNS JSONB AS $$
        DECLARE
          behavioral_score DECIMAL(3,2);
          temporal_score DECIMAL(3,2);
          network_score DECIMAL(3,2);
          overall_score DECIMAL(3,2);
          detection_reasons JSONB;
        BEGIN
          -- Behavioral analysis
          SELECT 
            CASE 
              WHEN COUNT(*) > 100 THEN 0.8
              WHEN COUNT(*) > 50 THEN 0.6
              WHEN COUNT(*) > 20 THEN 0.4
              ELSE 0.2
            END INTO behavioral_score
          FROM votes
          WHERE user_id = p_user_id
            AND created_at >= NOW() - INTERVAL '1 hour';
          
          -- Temporal analysis (voting patterns)
          SELECT 
            CASE 
              WHEN COUNT(*) > 0 AND AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) < 5 THEN 0.9
              WHEN COUNT(*) > 0 AND AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) < 30 THEN 0.7
              ELSE 0.3
            END INTO temporal_score
          FROM votes
          WHERE user_id = p_user_id
            AND created_at >= NOW() - INTERVAL '1 hour';
          
          -- Network analysis (IP patterns, etc.)
          network_score := 0.5; -- Placeholder for network analysis
          
          -- Calculate overall score
          overall_score := (behavioral_score + temporal_score + network_score) / 3;
          
          -- Generate detection reasons
          detection_reasons := jsonb_build_object(
            'high_activity', behavioral_score > 0.7,
            'rapid_voting', temporal_score > 0.7,
            'suspicious_patterns', overall_score > 0.6,
            'bot_likelihood', overall_score
          );
          
          RETURN jsonb_build_object(
            'behavioral_score', behavioral_score,
            'temporal_score', temporal_score,
            'network_score', network_score,
            'overall_score', overall_score,
            'detection_reasons', detection_reasons
          );
        END;
        $$ LANGUAGE plpgsql;
      `
    }
  ];

  // Create functions
  for (const func of analysisFunctions) {
    try {
      console.log(`📝 Creating function: ${func.name}`);
      
      const { error } = await supabase
        .rpc('exec_sql', { sql: func.sql });

      if (error) {
        console.error(`❌ Error creating function ${func.name}:`, error);
        results.functionsFailed++;
        results.errors.push(`Failed to create function ${func.name}: ${error.message}`);
      } else {
        console.log(`✅ Function created: ${func.name}`);
        results.functionsCreated++;
      }
    } catch (error) {
      console.error(`❌ Error creating function ${func.name}:`, error);
      results.functionsFailed++;
      results.errors.push(`Error creating function ${func.name}: ${error.message}`);
    }
  }

  return results;
}

async function generateTrustTierAnalysisReport(tableResults, functionResults) {
  const report = `# 🧠 Trust Tier Analysis System

**Date**: ${new Date().toISOString().split('T')[0]}  
**Status**: ${tableResults.errors.length === 0 && functionResults.errors.length === 0 ? '✅ SUCCESS' : '⚠️ PARTIAL SUCCESS'}  
**Purpose**: Sophisticated bot detection and narrative analysis via trust tiers

---

## 📊 **RESULTS SUMMARY**

### **Tables Created:**
- **Tables Created**: ${tableResults.tablesCreated}
- **Tables Failed**: ${tableResults.tablesFailed}

### **Functions Created:**
- **Functions Created**: ${functionResults.functionsCreated}
- **Functions Failed**: ${functionResults.functionsFailed}

---

## 🎯 **TRUST TIER ANALYSIS STRATEGY**

### **Trust Tier Definitions:**
- **Tier 1 (Verified)**: High-trust users with verified identity
- **Tier 2 (Established)**: Users with consistent engagement history  
- **Tier 3 (New)**: New users with limited history
- **Anonymous**: Unverified users (potential bots)

### **Analysis Types:**
- **Bot Detection**: Identify coordinated or automated behavior
- **Narrative Analysis**: Compare sentiment across trust tiers
- **Sentiment Analysis**: Measure emotional response to content
- **Propaganda Detection**: Flag potential manipulation

---

## 🔍 **BOT DETECTION METHODS**

### **1. Behavioral Analysis:**
- **Vote Frequency**: Unusually high voting activity
- **Response Patterns**: Identical or very similar responses
- **Time Patterns**: Voting at suspicious intervals
- **Content Patterns**: Repetitive or templated content

### **2. Temporal Analysis:**
- **Rapid Voting**: Votes submitted too quickly
- **Batch Activity**: Multiple votes in short timeframes
- **Time Zone Patterns**: Unusual geographic voting patterns
- **Session Patterns**: Suspicious session behavior

### **3. Network Analysis:**
- **IP Address Patterns**: Multiple accounts from same IP
- **Device Fingerprinting**: Similar device characteristics
- **Geographic Clustering**: Unusual geographic distribution
- **Connection Patterns**: Suspicious network behavior

---

## 📊 **NARRATIVE ANALYSIS FEATURES**

### **Sentiment Comparison:**
- **Tier 1 vs Tier 2**: Compare verified vs established users
- **Tier 1 vs Tier 3**: Compare verified vs new users
- **Tier 1 vs Anonymous**: Compare verified vs anonymous users
- **Cross-Tier Analysis**: Identify significant divergences

### **Propaganda Indicators:**
- **High Divergence**: Significant differences between tiers
- **Anonymous Bias**: Anonymous users show different sentiment
- **New User Bias**: New users show different sentiment
- **Coordinated Activity**: Suspicious patterns across tiers

---

## 🎯 **TRUST-WEIGHTED VOTING**

### **Weight System:**
- **Tier 1 (Verified)**: Weight = 1.0 (Full trust)
- **Tier 2 (Established)**: Weight = 0.8 (High trust)
- **Tier 3 (New)**: Weight = 0.6 (Medium trust)
- **Anonymous**: Weight = 0.3 (Low trust)

### **Weighted Results:**
- **Authentic Sentiment**: Emphasize verified user opinions
- **Bot Filtering**: Reduce impact of potential bots
- **Quality Control**: Ensure reliable results
- **Trust Metrics**: Measure content credibility

---

## 🚀 **IMPLEMENTATION FEATURES**

### **Database Tables:**
- **trust_tier_analytics**: Store analysis results
- **narrative_analysis_results**: Track narrative divergence
- **trust_weighted_votes**: Implement weighted voting
- **bot_detection_logs**: Log bot detection events

### **Analysis Functions:**
- **analyze_narrative_divergence**: Compare sentiment across tiers
- **calculate_trust_weighted_votes**: Implement weighted voting
- **detect_bot_behavior**: Identify suspicious behavior

### **API Endpoints:**
- **GET /api/analysis/narrative/[content_id]**: Get narrative analysis
- **GET /api/analysis/bot-detection/[user_id]**: Check for bot behavior
- **GET /api/votes/weighted/[poll_id]**: Get trust-weighted results
- **POST /api/analysis/run-analysis**: Trigger analysis

---

## 🎉 **BENEFITS**

### **Security Benefits:**
- **Bot Detection**: Identify and filter automated behavior
- **Propaganda Detection**: Flag potential manipulation
- **Quality Control**: Ensure authentic user engagement
- **Trust Metrics**: Measure content credibility

### **Analytics Benefits:**
- **Sentiment Analysis**: Understand user opinions
- **Narrative Tracking**: Monitor story evolution
- **Influence Detection**: Identify manipulation attempts
- **Trust Metrics**: Measure platform credibility

### **User Experience Benefits:**
- **Authentic Results**: Show real user opinions
- **Trust Indicators**: Display content credibility
- **Quality Content**: Filter out spam and bots
- **Reliable Data**: Ensure accurate information

---

## 📱 **USER INTERFACE FEATURES**

### **Trust Indicators:**
- **Content Credibility**: Show trust scores for content
- **User Verification**: Display user trust levels
- **Bot Warnings**: Alert users to potential bots
- **Quality Metrics**: Show content quality scores

### **Analysis Views:**
- **"Everyone" View**: All votes/responses
- **"Trusted Users" View**: Only Tier 1-2 users
- **"New Users" View**: Only Tier 3 users
- **"Anonymous" View**: Unverified users

### **Filtering Options:**
- **Trust Level**: Filter by trust tier
- **Verification Status**: Show verified users only
- **Time Range**: Filter by time period
- **Geographic**: Filter by location

---

## 🔧 **TECHNICAL IMPLEMENTATION**

### **Analysis Pipeline:**
1. **Data Collection**: Gather votes and user data
2. **Trust Assessment**: Calculate user trust levels
3. **Behavioral Analysis**: Detect suspicious patterns
4. **Narrative Analysis**: Compare sentiment across tiers
5. **Result Generation**: Create analysis reports

### **Real-time Processing:**
- **Live Analysis**: Continuous monitoring
- **Alert System**: Notify of suspicious activity
- **Auto-filtering**: Remove detected bots
- **Quality Metrics**: Update trust scores

---

*This trust tier analysis system was generated on ${new Date().toISOString()}.*`;

  const outputPath = path.join(__dirname, '..', 'scratch', 'planning-2025', 'TRUST_TIER_ANALYSIS_SYSTEM.md');
  
  try {
    fs.writeFileSync(outputPath, report);
    console.log(`✅ Trust tier analysis system report generated: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error writing report:', error);
  }
}

async function main() {
  console.log('🚀 Starting trust tier analysis system...');
  
  const tableResults = await createTrustTierAnalysisTables();
  const functionResults = await createTrustTierAnalysisFunctions();
  
  console.log('\n📊 Trust Tier Analysis Results:');
  console.log(`Tables Created: ${tableResults.tablesCreated}`);
  console.log(`Tables Failed: ${tableResults.tablesFailed}`);
  console.log(`Functions Created: ${functionResults.functionsCreated}`);
  console.log(`Functions Failed: ${functionResults.functionsFailed}`);
  
  const totalErrors = [...tableResults.errors, ...functionResults.errors];
  if (totalErrors.length > 0) {
    console.log('\n❌ Errors:');
    totalErrors.forEach(error => console.log(`  - ${error}`));
  }
  
  await generateTrustTierAnalysisReport(tableResults, functionResults);
  
  if (totalErrors.length === 0) {
    console.log('\n🎉 Trust tier analysis system completed successfully!');
  } else {
    console.log('\n⚠️ Trust tier analysis system completed with some issues. Check the report for details.');
  }
}

main().catch(console.error);
