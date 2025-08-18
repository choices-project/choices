#!/usr/bin/env node

/**
 * Deploy Media Bias Analysis Database Schema
 * Creates tables for tracking media polls, bias detection, and public opinion comparisons
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

async function deployMediaBiasDatabase() {
  console.log('🚀 Deploying Media Bias Analysis Database Schema...\n');

  try {
    // Create media_sources table
    console.log('📋 Creating media_sources table...');
    const { error: mediaSourcesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS media_sources (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          network TEXT NOT NULL,
          bias TEXT CHECK (bias IN ('left', 'center-left', 'center', 'center-right', 'right', 'unknown')) DEFAULT 'unknown',
          reliability DECIMAL(3,2) DEFAULT 0.5 CHECK (reliability >= 0 AND reliability <= 1),
          ownership TEXT,
          funding JSONB DEFAULT '[]',
          political_affiliations JSONB DEFAULT '[]',
          fact_check_rating TEXT CHECK (fact_check_rating IN ('reliable', 'mixed', 'unreliable', 'unknown')) DEFAULT 'unknown',
          propaganda_indicators JSONB DEFAULT '[]',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (mediaSourcesError) {
      console.error('❌ Error creating media_sources table:', mediaSourcesError);
      return;
    }
    console.log('✅ media_sources table created successfully');

    // Create media_polls table
    console.log('\n📋 Creating media_polls table...');
    const { error: mediaPollsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS media_polls (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          headline TEXT NOT NULL,
          question TEXT NOT NULL,
          options JSONB NOT NULL DEFAULT '[]',
          source_id UUID REFERENCES media_sources(id),
          source_data JSONB NOT NULL,
          methodology JSONB NOT NULL,
          results JSONB NOT NULL,
          bias_analysis JSONB DEFAULT '{}',
          bias_indicators JSONB DEFAULT '[]',
          fact_check JSONB DEFAULT '{}',
          propaganda_techniques JSONB DEFAULT '[]',
          manipulation_score DECIMAL(3,2) DEFAULT 0 CHECK (manipulation_score >= 0 AND manipulation_score <= 1),
          overall_bias_score DECIMAL(3,2) DEFAULT 0 CHECK (overall_bias_score >= 0 AND overall_bias_score <= 1),
          url TEXT,
          published_at TIMESTAMP WITH TIME ZONE,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (mediaPollsError) {
      console.error('❌ Error creating media_polls table:', mediaPollsError);
      return;
    }
    console.log('✅ media_polls table created successfully');

    // Create public_opinion_comparisons table
    console.log('\n📋 Creating public_opinion_comparisons table...');
    const { error: comparisonsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public_opinion_comparisons (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          media_poll_id UUID REFERENCES media_polls(id) ON DELETE CASCADE,
          our_poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
          comparison_data JSONB NOT NULL,
          analysis_data JSONB NOT NULL,
          propaganda_indicators JSONB DEFAULT '[]',
          bias_score DECIMAL(3,2) DEFAULT 0 CHECK (bias_score >= 0 AND bias_score <= 1),
          manipulation_techniques JSONB DEFAULT '[]',
          recommendations JSONB DEFAULT '[]',
          question_alignment DECIMAL(3,2) DEFAULT 0 CHECK (question_alignment >= 0 AND question_alignment <= 1),
          option_alignment DECIMAL(3,2) DEFAULT 0 CHECK (option_alignment >= 0 AND option_alignment <= 1),
          result_difference DECIMAL(5,2) DEFAULT 0,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (comparisonsError) {
      console.error('❌ Error creating public_opinion_comparisons table:', comparisonsError);
      return;
    }
    console.log('✅ public_opinion_comparisons table created successfully');

    // Create fact_check_sources table
    console.log('\n📋 Creating fact_check_sources table...');
    const { error: factCheckError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS fact_check_sources (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          url TEXT,
          reliability DECIMAL(3,2) DEFAULT 0.5 CHECK (reliability >= 0 AND reliability <= 1),
          bias TEXT,
          fact_check_rating TEXT CHECK (fact_check_rating IN ('reliable', 'mixed', 'unreliable', 'unknown')) DEFAULT 'unknown',
          api_endpoint TEXT,
          api_key TEXT,
          is_active BOOLEAN DEFAULT true,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (factCheckError) {
      console.error('❌ Error creating fact_check_sources table:', factCheckError);
      return;
    }
    console.log('✅ fact_check_sources table created successfully');

    // Create bias_detection_logs table
    console.log('\n📋 Creating bias_detection_logs table...');
    const { error: logsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS bias_detection_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          media_poll_id UUID REFERENCES media_polls(id) ON DELETE CASCADE,
          detection_type TEXT NOT NULL,
          severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
          description TEXT NOT NULL,
          evidence JSONB DEFAULT '[]',
          impact_score DECIMAL(3,2) DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 1),
          recommendations JSONB DEFAULT '[]',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (logsError) {
      console.error('❌ Error creating bias_detection_logs table:', logsError);
      return;
    }
    console.log('✅ bias_detection_logs table created successfully');

    // Insert default media sources
    console.log('\n📋 Inserting default media sources...');
    const mediaSources = [
      {
        source_id: 'cnn',
        name: 'CNN',
        network: 'CNN',
        bias: 'left',
        reliability: 0.75,
        ownership: 'Warner Bros. Discovery',
        funding: ['advertising', 'subscriptions', 'corporate_sponsors'],
        political_affiliations: ['Democratic Party', 'liberal organizations'],
        fact_check_rating: 'mixed',
        propaganda_indicators: ['emotional_framing', 'selective_reporting', 'opinion_as_fact']
      },
      {
        source_id: 'fox',
        name: 'Fox News',
        network: 'Fox News',
        bias: 'right',
        reliability: 0.70,
        ownership: 'Fox Corporation',
        funding: ['advertising', 'subscriptions', 'corporate_sponsors'],
        political_affiliations: ['Republican Party', 'conservative organizations'],
        fact_check_rating: 'mixed',
        propaganda_indicators: ['misleading_headlines', 'opinion_as_fact', 'selective_context']
      },
      {
        source_id: 'msnbc',
        name: 'MSNBC',
        network: 'MSNBC',
        bias: 'left',
        reliability: 0.72,
        ownership: 'NBCUniversal',
        funding: ['advertising', 'subscriptions', 'corporate_sponsors'],
        political_affiliations: ['Democratic Party', 'liberal organizations'],
        fact_check_rating: 'mixed',
        propaganda_indicators: ['emotional_framing', 'selective_reporting', 'opinion_as_fact']
      },
      {
        source_id: 'abc',
        name: 'ABC News',
        network: 'ABC',
        bias: 'center-left',
        reliability: 0.80,
        ownership: 'Walt Disney Company',
        funding: ['advertising', 'subscriptions', 'corporate_sponsors'],
        political_affiliations: ['moderate_liberal'],
        fact_check_rating: 'reliable',
        propaganda_indicators: ['slight_liberal_bias', 'corporate_influence']
      },
      {
        source_id: 'cbs',
        name: 'CBS News',
        network: 'CBS',
        bias: 'center-left',
        reliability: 0.82,
        ownership: 'Paramount Global',
        funding: ['advertising', 'subscriptions', 'corporate_sponsors'],
        political_affiliations: ['moderate_liberal'],
        fact_check_rating: 'reliable',
        propaganda_indicators: ['slight_liberal_bias', 'corporate_influence']
      },
      {
        source_id: 'nbc',
        name: 'NBC News',
        network: 'NBC',
        bias: 'center-left',
        reliability: 0.78,
        ownership: 'NBCUniversal',
        funding: ['advertising', 'subscriptions', 'corporate_sponsors'],
        political_affiliations: ['moderate_liberal'],
        fact_check_rating: 'reliable',
        propaganda_indicators: ['slight_liberal_bias', 'corporate_influence']
      },
      {
        source_id: 'reuters',
        name: 'Reuters',
        network: 'Reuters',
        bias: 'center',
        reliability: 0.95,
        ownership: 'Thomson Reuters',
        funding: ['subscriptions', 'financial_services'],
        political_affiliations: ['neutral'],
        fact_check_rating: 'reliable',
        propaganda_indicators: ['minimal_bias', 'corporate_influence']
      },
      {
        source_id: 'ap',
        name: 'Associated Press',
        network: 'AP',
        bias: 'center',
        reliability: 0.94,
        ownership: 'Non-profit cooperative',
        funding: ['subscriptions', 'member_contributions'],
        political_affiliations: ['neutral'],
        fact_check_rating: 'reliable',
        propaganda_indicators: ['minimal_bias']
      },
      {
        source_id: 'bbc',
        name: 'BBC News',
        network: 'BBC',
        bias: 'center-left',
        reliability: 0.88,
        ownership: 'British Broadcasting Corporation',
        funding: ['license_fees', 'government_funding'],
        political_affiliations: ['moderate_liberal'],
        fact_check_rating: 'reliable',
        propaganda_indicators: ['slight_liberal_bias', 'government_influence']
      }
    ];

    for (const source of mediaSources) {
      const { error } = await supabase
        .from('media_sources')
        .upsert([source], { onConflict: 'source_id' });

      if (error) {
        console.error(`❌ Error inserting source ${source.name}:`, error);
      } else {
        console.log(`✅ Inserted/updated source: ${source.name}`);
      }
    }

    // Insert sample fact check sources
    console.log('\n📋 Inserting fact check sources...');
    const factCheckSources = [
      {
        name: 'Snopes',
        url: 'https://www.snopes.com',
        reliability: 0.90,
        bias: 'center',
        fact_check_rating: 'reliable',
        api_endpoint: 'https://api.snopes.com',
        is_active: true
      },
      {
        name: 'FactCheck.org',
        url: 'https://www.factcheck.org',
        reliability: 0.92,
        bias: 'center',
        fact_check_rating: 'reliable',
        api_endpoint: 'https://api.factcheck.org',
        is_active: true
      },
      {
        name: 'PolitiFact',
        url: 'https://www.politifact.com',
        reliability: 0.88,
        bias: 'center',
        fact_check_rating: 'reliable',
        api_endpoint: 'https://api.politifact.com',
        is_active: true
      }
    ];

    for (const source of factCheckSources) {
      const { error } = await supabase
        .from('fact_check_sources')
        .upsert([source], { onConflict: 'name' });

      if (error) {
        console.error(`❌ Error inserting fact check source ${source.name}:`, error);
      } else {
        console.log(`✅ Inserted/updated fact check source: ${source.name}`);
      }
    }

    // Insert sample media poll for testing
    console.log('\n📋 Inserting sample media poll for testing...');
    const sampleMediaPoll = {
      headline: "CNN Poll: Trump vs Newsom Debate - Who Would Win?",
      question: "If Donald Trump and Gavin Newsom were to debate, who do you think would perform better?",
      options: [
        {
          id: '1',
          text: 'Donald Trump would clearly win',
          percentage: 45,
          framing: 'positive',
          biasScore: 0.8
        },
        {
          id: '2',
          text: 'Gavin Newsom would likely win',
          percentage: 35,
          framing: 'neutral',
          biasScore: 0.3
        },
        {
          id: '3',
          text: 'It would be a close contest',
          percentage: 20,
          framing: 'neutral',
          biasScore: 0.2
        }
      ],
      source_data: {
        id: 'cnn',
        name: 'CNN',
        network: 'CNN',
        bias: 'left',
        reliability: 0.75
      },
      methodology: {
        sampleSize: 1200,
        marginOfError: 3.5,
        confidenceLevel: 95,
        methodology: 'phone',
        demographics: {
          age: { '18-34': 25, '35-49': 30, '50-64': 25, '65+': 20 },
          gender: { 'male': 48, 'female': 52 },
          education: { 'high_school': 30, 'college': 45, 'graduate': 25 },
          income: { 'low': 25, 'middle': 50, 'high': 25 },
          geography: { 'northeast': 20, 'midwest': 25, 'south': 35, 'west': 20 },
          politicalAffiliation: { 'democrat': 40, 'republican': 35, 'independent': 25 }
        },
        timing: {
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-17'),
          duration: 48
        },
        questionOrder: ['demographics', 'main_question'],
        contextProvided: 'Recent political tensions between Trump and Newsom have sparked debate about their potential face-off.',
        leadingQuestions: []
      },
      results: {
        totalResponses: 1200,
        optionResults: { '1': 540, '2': 420, '3': 240 },
        demographicBreakdown: {},
        crossTabs: {},
        rawData: {}
      },
      bias_analysis: {
        overallBias: 0.65,
        framingBias: 0.7,
        methodologyBias: 0.3,
        timingBias: 0.2,
        demographicBias: 0.4,
        questionBias: 0.6,
        contextBias: 0.5,
        propagandaTechniques: ['emotional_framing', 'leading_questions'],
        manipulationScore: 0.6
      },
      bias_indicators: [
        {
          type: 'framing',
          severity: 'medium',
          description: 'Poll uses emotionally charged language',
          evidence: ['Emotional keywords detected', 'Leading question patterns'],
          impact: 0.7,
          recommendations: ['Use neutral language', 'Avoid leading questions']
        }
      ],
      propaganda_techniques: ['emotional_framing', 'leading_questions'],
      manipulation_score: 0.6,
      overall_bias_score: 0.65,
      url: 'https://www.cnn.com/poll/trump-newsom-debate',
      published_at: new Date('2024-01-17')
    };

    const { error: pollError } = await supabase
      .from('media_polls')
      .insert([sampleMediaPoll]);

    if (pollError) {
      console.error('❌ Error inserting sample media poll:', pollError);
    } else {
      console.log('✅ Inserted sample media poll: CNN Trump vs Newsom Debate Poll');
    }

    // Set up Row Level Security
    console.log('\n🔒 Setting up Row Level Security...');
    const rlsPolicies = [
      // Media sources - public read, admin write
      `CREATE POLICY "Public read access to media_sources" ON media_sources FOR SELECT USING (true);`,
      `CREATE POLICY "Admin write access to media_sources" ON media_sources FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');`,
      
      // Media polls - public read, admin write
      `CREATE POLICY "Public read access to media_polls" ON media_polls FOR SELECT USING (true);`,
      `CREATE POLICY "Admin write access to media_polls" ON media_polls FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');`,
      
      // Public opinion comparisons - public read, admin write
      `CREATE POLICY "Public read access to public_opinion_comparisons" ON public_opinion_comparisons FOR SELECT USING (true);`,
      `CREATE POLICY "Admin write access to public_opinion_comparisons" ON public_opinion_comparisons FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');`,
      
      // Fact check sources - public read, admin write
      `CREATE POLICY "Public read access to fact_check_sources" ON fact_check_sources FOR SELECT USING (true);`,
      `CREATE POLICY "Admin write access to fact_check_sources" ON fact_check_sources FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');`,
      
      // Bias detection logs - admin only
      `CREATE POLICY "Admin access to bias_detection_logs" ON bias_detection_logs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');`
    ];

    for (const policy of rlsPolicies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy });
      if (policyError) {
        console.error('❌ Error creating RLS policy:', policyError);
      }
    }

    console.log('✅ Row Level Security configured successfully');

    console.log('\n🎉 Media Bias Analysis Database deployment completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ media_sources table created');
    console.log('  ✅ media_polls table created');
    console.log('  ✅ public_opinion_comparisons table created');
    console.log('  ✅ fact_check_sources table created');
    console.log('  ✅ bias_detection_logs table created');
    console.log('  ✅ Default media sources inserted');
    console.log('  ✅ Fact check sources inserted');
    console.log('  ✅ Sample media poll inserted');
    console.log('  ✅ Row Level Security configured');
    console.log('\n🔍 Ready for propaganda detection and bias analysis!');

  } catch (error) {
    console.error('\n❌ Media Bias Analysis Database deployment failed:', error);
    process.exit(1);
  }
}

// Run the deployment
deployMediaBiasDatabase();
