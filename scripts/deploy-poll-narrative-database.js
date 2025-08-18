// Deploy Poll Narrative Database Schema
// Comprehensive system for story-driven polls with community moderation

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployPollNarrativeDatabase() {
  console.log('🚀 Deploying Poll Narrative Database Schema...\n');

  try {
    // ============================================================================
    // CORE NARRATIVE TABLES
    // ============================================================================

    console.log('📋 Creating poll_narratives table...');
    const { error: narrativesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS poll_narratives (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          poll_id TEXT NOT NULL,
          title TEXT NOT NULL,
          summary TEXT NOT NULL,
          full_story TEXT,
          context JSONB DEFAULT '{}',
          controversy JSONB DEFAULT '{}',
          moderation JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_moderated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (narrativesError) throw narrativesError;
    console.log('✅ Created poll_narratives table');

    // ============================================================================
    // FACT VERIFICATION TABLES
    // ============================================================================

    console.log('📋 Creating verified_facts table...');
    const { error: verifiedFactsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS verified_facts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          narrative_id UUID REFERENCES poll_narratives(id) ON DELETE CASCADE,
          statement TEXT NOT NULL,
          category TEXT DEFAULT 'fact' CHECK (category IN ('fact', 'statistic', 'quote', 'document', 'event', 'policy')),
          verification_level TEXT DEFAULT 'unverified' CHECK (verification_level IN ('verified', 'partially_verified', 'unverified', 'disputed')),
          sources JSONB DEFAULT '[]',
          fact_checkers JSONB DEFAULT '[]',
          last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
          tags TEXT[] DEFAULT '{}',
          related_facts TEXT[] DEFAULT '{}',
          controversy DECIMAL(3,2) DEFAULT 0.0 CHECK (controversy >= 0 AND controversy <= 1),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (verifiedFactsError) throw verifiedFactsError;
    console.log('✅ Created verified_facts table');

    console.log('📋 Creating community_facts table...');
    const { error: communityFactsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS community_facts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          narrative_id UUID REFERENCES poll_narratives(id) ON DELETE CASCADE,
          statement TEXT NOT NULL,
          category TEXT DEFAULT 'fact' CHECK (category IN ('fact', 'opinion', 'anecdote', 'question', 'correction')),
          submitted_by UUID REFERENCES auth.users(id),
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
          votes JSONB DEFAULT '{"helpful": 0, "notHelpful": 0, "verified": 0, "disputed": 0}',
          moderator_notes TEXT,
          reviewed_by UUID REFERENCES auth.users(id),
          reviewed_at TIMESTAMP WITH TIME ZONE,
          sources TEXT[] DEFAULT '{}',
          tags TEXT[] DEFAULT '{}',
          parent_fact UUID REFERENCES community_facts(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (communityFactsError) throw communityFactsError;
    console.log('✅ Created community_facts table');

    // ============================================================================
    // SOURCES AND TIMELINE TABLES
    // ============================================================================

    console.log('📋 Creating narrative_sources table...');
    const { error: sourcesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS narrative_sources (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          narrative_id UUID REFERENCES poll_narratives(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          url TEXT,
          type TEXT DEFAULT 'article' CHECK (type IN ('article', 'video', 'document', 'interview', 'press_release', 'social_media')),
          source TEXT NOT NULL,
          author TEXT,
          publish_date TIMESTAMP WITH TIME ZONE,
          reliability DECIMAL(3,2) DEFAULT 0.5 CHECK (reliability >= 0 AND reliability <= 1),
          bias TEXT DEFAULT 'unknown' CHECK (bias IN ('left', 'center-left', 'center', 'center-right', 'right', 'unknown')),
          summary TEXT,
          key_quotes TEXT[] DEFAULT '{}',
          fact_check_status TEXT DEFAULT 'pending' CHECK (fact_check_status IN ('verified', 'mixed', 'disputed', 'pending')),
          community_rating DECIMAL(2,1) DEFAULT 0.0 CHECK (community_rating >= 0 AND community_rating <= 5),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (sourcesError) throw sourcesError;
    console.log('✅ Created narrative_sources table');

    console.log('📋 Creating timeline_events table...');
    const { error: timelineError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS timeline_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          narrative_id UUID REFERENCES poll_narratives(id) ON DELETE CASCADE,
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          significance TEXT DEFAULT 'medium' CHECK (significance IN ('low', 'medium', 'high', 'critical')),
          sources TEXT[] DEFAULT '{}',
          verified BOOLEAN DEFAULT false,
          controversy DECIMAL(3,2) DEFAULT 0.0 CHECK (controversy >= 0 AND controversy <= 1),
          tags TEXT[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (timelineError) throw timelineError;
    console.log('✅ Created timeline_events table');

    // ============================================================================
    // STAKEHOLDERS TABLE
    // ============================================================================

    console.log('📋 Creating stakeholders table...');
    const { error: stakeholdersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS stakeholders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          narrative_id UUID REFERENCES poll_narratives(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          type TEXT DEFAULT 'individual' CHECK (type IN ('individual', 'organization', 'government', 'corporation', 'group')),
          role TEXT,
          position TEXT DEFAULT 'unknown' CHECK (position IN ('support', 'oppose', 'neutral', 'mixed', 'unknown')),
          influence DECIMAL(3,2) DEFAULT 0.5 CHECK (influence >= 0 AND influence <= 1),
          credibility DECIMAL(3,2) DEFAULT 0.5 CHECK (credibility >= 0 AND credibility <= 1),
          background TEXT,
          statements JSONB DEFAULT '[]',
          conflicts TEXT[] DEFAULT '{}',
          sources TEXT[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (stakeholdersError) throw stakeholdersError;
    console.log('✅ Created stakeholders table');

    // ============================================================================
    // MODERATION TABLES
    // ============================================================================

    console.log('📋 Creating moderation_actions table...');
    const { error: moderationActionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS moderation_actions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          narrative_id UUID REFERENCES poll_narratives(id) ON DELETE CASCADE,
          moderator_id UUID REFERENCES auth.users(id),
          action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'request_revision', 'flag', 'fact_check')),
          reason TEXT NOT NULL,
          details TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          follow_up_required BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (moderationActionsError) throw moderationActionsError;
    console.log('✅ Created moderation_actions table');

    console.log('📋 Creating community_moderators table...');
    const { error: moderatorsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS community_moderators (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) UNIQUE,
          level TEXT DEFAULT 'junior' CHECK (level IN ('junior', 'senior', 'expert', 'admin')),
          expertise TEXT[] DEFAULT '{}',
          reliability DECIMAL(3,2) DEFAULT 0.5 CHECK (reliability >= 0 AND reliability <= 1),
          review_count INTEGER DEFAULT 0,
          accuracy DECIMAL(3,2) DEFAULT 0.5 CHECK (accuracy >= 0 AND accuracy <= 1),
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (moderatorsError) throw moderatorsError;
    console.log('✅ Created community_moderators table');

    console.log('📋 Creating moderation_queue table...');
    const { error: queueError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS moderation_queue (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          narrative_id UUID REFERENCES poll_narratives(id) ON DELETE CASCADE,
          priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          assigned_to UUID REFERENCES community_moderators(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          estimated_time INTEGER DEFAULT 60, -- minutes
          category TEXT DEFAULT 'quality_assessment' CHECK (category IN ('fact_check', 'bias_review', 'quality_assessment', 'community_dispute')),
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
        );
      `
    });

    if (queueError) throw queueError;
    console.log('✅ Created moderation_queue table');

    // ============================================================================
    // FACT VERIFICATION TABLES
    // ============================================================================

    console.log('📋 Creating fact_verification_requests table...');
    const { error: verificationRequestsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS fact_verification_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          fact_id UUID REFERENCES verified_facts(id) ON DELETE CASCADE,
          requester_id UUID REFERENCES auth.users(id),
          reason TEXT NOT NULL,
          evidence TEXT[] DEFAULT '{}',
          priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
          assigned_to UUID REFERENCES community_moderators(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE,
          result JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (verificationRequestsError) throw verificationRequestsError;
    console.log('✅ Created fact_verification_requests table');

    // ============================================================================
    // INDEXES FOR PERFORMANCE
    // ============================================================================

    console.log('📋 Creating indexes...');
    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Poll narratives indexes
        CREATE INDEX IF NOT EXISTS idx_poll_narratives_poll_id ON poll_narratives(poll_id);
        CREATE INDEX IF NOT EXISTS idx_poll_narratives_status ON poll_narratives((moderation->>'status'));
        CREATE INDEX IF NOT EXISTS idx_poll_narratives_created_at ON poll_narratives(created_at);
        
        -- Facts indexes
        CREATE INDEX IF NOT EXISTS idx_verified_facts_narrative_id ON verified_facts(narrative_id);
        CREATE INDEX IF NOT EXISTS idx_verified_facts_verification_level ON verified_facts(verification_level);
        CREATE INDEX IF NOT EXISTS idx_community_facts_narrative_id ON community_facts(narrative_id);
        CREATE INDEX IF NOT EXISTS idx_community_facts_status ON community_facts(status);
        CREATE INDEX IF NOT EXISTS idx_community_facts_submitted_by ON community_facts(submitted_by);
        
        -- Sources and timeline indexes
        CREATE INDEX IF NOT EXISTS idx_narrative_sources_narrative_id ON narrative_sources(narrative_id);
        CREATE INDEX IF NOT EXISTS idx_timeline_events_narrative_id ON timeline_events(narrative_id);
        CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(date);
        
        -- Stakeholders indexes
        CREATE INDEX IF NOT EXISTS idx_stakeholders_narrative_id ON stakeholders(narrative_id);
        CREATE INDEX IF NOT EXISTS idx_stakeholders_position ON stakeholders(position);
        
        -- Moderation indexes
        CREATE INDEX IF NOT EXISTS idx_moderation_actions_narrative_id ON moderation_actions(narrative_id);
        CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator_id ON moderation_actions(moderator_id);
        CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON moderation_queue(priority);
        CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
        
        -- Verification indexes
        CREATE INDEX IF NOT EXISTS idx_verification_requests_fact_id ON fact_verification_requests(fact_id);
        CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON fact_verification_requests(status);
      `
    });

    if (indexesError) throw indexesError;
    console.log('✅ Created performance indexes');

    // ============================================================================
    // ROW LEVEL SECURITY (RLS) POLICIES
    // ============================================================================

    console.log('📋 Setting up Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on all tables
        ALTER TABLE poll_narratives ENABLE ROW LEVEL SECURITY;
        ALTER TABLE verified_facts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE community_facts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE narrative_sources ENABLE ROW LEVEL SECURITY;
        ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
        ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
        ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE community_moderators ENABLE ROW LEVEL SECURITY;
        ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
        ALTER TABLE fact_verification_requests ENABLE ROW LEVEL SECURITY;

        -- Poll narratives policies
        CREATE POLICY "Public read access to approved narratives" ON poll_narratives
          FOR SELECT USING (moderation->>'status' = 'approved');
        
        CREATE POLICY "Authenticated users can create narratives" ON poll_narratives
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
        CREATE POLICY "Owners and moderators can update narratives" ON poll_narratives
          FOR UPDATE USING (
            auth.uid()::text = moderation->>'moderator' OR 
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid())
          );

        -- Verified facts policies
        CREATE POLICY "Public read access to verified facts" ON verified_facts
          FOR SELECT USING (true);
        
        CREATE POLICY "Moderators can manage verified facts" ON verified_facts
          FOR ALL USING (
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid())
          );

        -- Community facts policies
        CREATE POLICY "Public read access to approved community facts" ON community_facts
          FOR SELECT USING (status = 'approved');
        
        CREATE POLICY "Authenticated users can submit community facts" ON community_facts
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
        CREATE POLICY "Users can vote on community facts" ON community_facts
          FOR UPDATE USING (auth.role() = 'authenticated');
        
        CREATE POLICY "Moderators can manage community facts" ON community_facts
          FOR ALL USING (
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid())
          );

        -- Sources and timeline policies
        CREATE POLICY "Public read access to sources and timeline" ON narrative_sources
          FOR SELECT USING (true);
        CREATE POLICY "Public read access to sources and timeline" ON timeline_events
          FOR SELECT USING (true);
        
        CREATE POLICY "Moderators can manage sources and timeline" ON narrative_sources
          FOR ALL USING (
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid())
          );
        CREATE POLICY "Moderators can manage sources and timeline" ON timeline_events
          FOR ALL USING (
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid())
          );

        -- Stakeholders policies
        CREATE POLICY "Public read access to stakeholders" ON stakeholders
          FOR SELECT USING (true);
        
        CREATE POLICY "Moderators can manage stakeholders" ON stakeholders
          FOR ALL USING (
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid())
          );

        -- Moderation policies
        CREATE POLICY "Moderators can view moderation actions" ON moderation_actions
          FOR SELECT USING (
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid())
          );
        
        CREATE POLICY "Moderators can create moderation actions" ON moderation_actions
          FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid())
          );

        -- Community moderators policies
        CREATE POLICY "Public read access to moderator profiles" ON community_moderators
          FOR SELECT USING (true);
        
        CREATE POLICY "Users can view their own moderator profile" ON community_moderators
          FOR SELECT USING (user_id = auth.uid());
        
        CREATE POLICY "Admins can manage moderators" ON community_moderators
          FOR ALL USING (
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid() AND level = 'admin')
          );

        -- Moderation queue policies
        CREATE POLICY "Moderators can view moderation queue" ON moderation_queue
          FOR SELECT USING (
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid())
          );
        
        CREATE POLICY "Moderators can update moderation queue" ON moderation_queue
          FOR UPDATE USING (
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid())
          );

        -- Verification requests policies
        CREATE POLICY "Users can view their own verification requests" ON fact_verification_requests
          FOR SELECT USING (requester_id = auth.uid());
        
        CREATE POLICY "Moderators can view all verification requests" ON fact_verification_requests
          FOR SELECT USING (
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid())
          );
        
        CREATE POLICY "Authenticated users can create verification requests" ON fact_verification_requests
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
        CREATE POLICY "Moderators can update verification requests" ON fact_verification_requests
          FOR UPDATE USING (
            EXISTS (SELECT 1 FROM community_moderators WHERE user_id = auth.uid())
          );
      `
    });

    if (rlsError) throw rlsError;
    console.log('✅ Set up Row Level Security policies');

    // ============================================================================
    // INSERT SAMPLE DATA
    // ============================================================================

    console.log('📋 Inserting sample data...');

    // Insert sample narrative
    const { data: narrativeData, error: narrativeInsertError } = await supabase
      .from('poll_narratives')
      .insert([{
        poll_id: 'newsom-trump-debate-poll',
        title: 'Gavin Newsom vs Donald Trump: The Presidential Debate Challenge',
        summary: 'California Governor Gavin Newsom has publicly challenged former President Donald Trump to a presidential debate, sparking intense political discourse.',
        full_story: 'In a bold political move that has captured national attention, California Governor Gavin Newsom has issued a direct challenge to former President Donald Trump for a presidential debate...',
        context: {
          background: 'Gavin Newsom has been a vocal critic of Trump\'s policies and leadership style.',
          currentSituation: 'Newsom has challenged Trump to a debate, Trump has responded dismissively.',
          keyIssues: ['Presidential debate protocols', 'Role of governors in national discourse'],
          historicalContext: 'This would be unprecedented.',
          geographicScope: 'national',
          timeSensitivity: 'high',
          complexity: 'moderate',
          politicalImpact: 0.8,
          economicImpact: 0.3,
          socialImpact: 0.7
        },
        controversy: {
          level: 'high',
          sources: ['source-1'],
          keyDisputes: [],
          consensusAreas: ['This is an unprecedented political move'],
          unresolvedIssues: ['Whether the debate will actually happen'],
          expertOpinions: [],
          publicSentiment: {
            overall: 'mixed',
            breakdown: { positive: 0.4, negative: 0.3, neutral: 0.3 },
            trends: [],
            demographics: {}
          }
        },
        moderation: {
          status: 'pending_review',
          moderator: '',
          reviewed_at: new Date(),
          notes: 'Sample narrative for testing',
          requiredChanges: [],
          communityScore: 0.8,
          factAccuracy: 0.9,
          biasAssessment: 0.7,
          overallQuality: 0.8
        }
      }])
      .select()
      .single();

    if (narrativeInsertError) throw narrativeInsertError;
    console.log('✅ Inserted sample narrative');

    const narrativeId = narrativeData.id;

    // Insert sample verified fact
    const { error: factInsertError } = await supabase
      .from('verified_facts')
      .insert([{
        narrative_id: narrativeId,
        statement: 'Gavin Newsom is the current Governor of California, serving since 2019.',
        category: 'fact',
        verification_level: 'verified',
        sources: [{
          id: 'source-1',
          name: 'California State Government',
          url: 'https://www.ca.gov/',
          type: 'government',
          reliability: 0.95,
          bias: 'center',
          lastAccessed: new Date(),
          accessibility: 'public'
        }],
        fact_checkers: [{
          id: 'checker-1',
          name: 'FactCheck.org',
          organization: 'Annenberg Public Policy Center',
          expertise: ['politics', 'government'],
          reliability: 0.9,
          methodology: 'Cross-referenced with official government records',
          conclusion: 'true',
          explanation: 'Verified through official California state records',
          dateChecked: new Date()
        }],
        confidence: 0.95,
        tags: ['politics', 'california', 'government'],
        controversy: 0.1
      }]);

    if (factInsertError) throw factInsertError;
    console.log('✅ Inserted sample verified fact');

    // Insert sample source
    const { error: sourceInsertError } = await supabase
      .from('narrative_sources')
      .insert([{
        narrative_id: narrativeId,
        title: 'Newsom Challenges Trump to Presidential Debate',
        url: 'https://example.com/newsom-trump-challenge',
        type: 'article',
        source: 'Reuters',
        author: 'John Smith',
        publish_date: new Date(),
        reliability: 0.9,
        bias: 'center',
        summary: 'California Governor Gavin Newsom has challenged former President Donald Trump to a presidential debate.',
        key_quotes: [
          '"I\'m ready to debate Donald Trump anytime, anywhere," Newsom said.',
          '"The American people deserve to see our visions side by side."'
        ],
        fact_check_status: 'verified',
        community_rating: 4.2
      }]);

    if (sourceInsertError) throw sourceInsertError;
    console.log('✅ Inserted sample source');

    // Insert sample timeline event
    const { error: timelineInsertError } = await supabase
      .from('timeline_events')
      .insert([{
        narrative_id: narrativeId,
        date: new Date('2024-01-15'),
        title: 'Newsom Issues Debate Challenge',
        description: 'During a television interview, Newsom publicly challenges Trump to a debate.',
        significance: 'high',
        sources: ['source-1'],
        verified: true,
        controversy: 0.3,
        tags: ['debate', 'challenge', 'politics']
      }]);

    if (timelineInsertError) throw timelineInsertError;
    console.log('✅ Inserted sample timeline event');

    // Insert sample stakeholder
    const { error: stakeholderInsertError } = await supabase
      .from('stakeholders')
      .insert([{
        narrative_id: narrativeId,
        name: 'Gavin Newsom',
        type: 'individual',
        role: 'California Governor',
        position: 'support',
        influence: 0.8,
        credibility: 0.7,
        background: 'Democratic governor of California since 2019',
        statements: [{
          id: 'statement-1',
          quote: 'I\'m ready to debate Donald Trump anytime, anywhere.',
          date: new Date('2024-01-15'),
          context: 'Television interview',
          source: 'CNN',
          verified: true,
          impact: 0.8
        }],
        conflicts: ['Political opponent of Trump'],
        sources: ['source-1']
      }]);

    if (stakeholderInsertError) throw stakeholderInsertError;
    console.log('✅ Inserted sample stakeholder');

    console.log('\n🎉 Poll Narrative Database deployment completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log('   • poll_narratives: Core narrative storage');
    console.log('   • verified_facts: Fact-checked information');
    console.log('   • community_facts: User-submitted facts with voting');
    console.log('   • narrative_sources: Source materials and references');
    console.log('   • timeline_events: Chronological event tracking');
    console.log('   • stakeholders: Key players and their positions');
    console.log('   • moderation_actions: Community moderation tracking');
    console.log('   • community_moderators: Moderator management');
    console.log('   • moderation_queue: Workflow management');
    console.log('   • fact_verification_requests: Fact-checking workflow');
    console.log('\n🔒 Security: Row Level Security enabled with role-based access');
    console.log('⚡ Performance: Indexes created for optimal query performance');
    console.log('📝 Sample Data: Example narrative with facts, sources, and stakeholders');

  } catch (error) {
    console.error('❌ Error deploying poll narrative database:', error);
    process.exit(1);
  }
}

// Run the deployment
deployPollNarrativeDatabase();
