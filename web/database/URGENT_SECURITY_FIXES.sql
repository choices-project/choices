-- ============================================================================
-- URGENT SECURITY FIXES - DATABASE SECURITY HARDENING
-- ============================================================================
-- This script addresses the critical security vulnerabilities identified
-- by querying the database directly. ALL TABLES currently have RLS DISABLED.
-- 
-- Created: 2025-10-01
-- Status: URGENT - Security Critical
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

-- Core application tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Civics tables
ALTER TABLE civics_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE civics_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE civics_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE civics_campaign_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE civics_votes ENABLE ROW LEVEL SECURITY;

-- Browser location tables
ALTER TABLE civic_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdiction_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdiction_geometries ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdiction_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_location_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_consent_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_jurisdictions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CREATE RLS POLICIES FOR CORE TABLES
-- ============================================================================

-- POLLS POLICIES
DROP POLICY IF EXISTS "Users can view public polls" ON polls;
CREATE POLICY "Users can view public polls" ON polls
  FOR SELECT USING (privacy_level = 'public');

DROP POLICY IF EXISTS "Users can view their own polls" ON polls;
CREATE POLICY "Users can view their own polls" ON polls
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create polls" ON polls;
CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own polls" ON polls;
CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE USING (
    auth.uid() = created_by 
    AND locked_at IS NULL
  );

DROP POLICY IF EXISTS "Users can delete their own polls" ON polls;
CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE USING (auth.uid() = created_by);

-- VOTES POLICIES
DROP POLICY IF EXISTS "Users can view votes on public polls" ON votes;
CREATE POLICY "Users can view votes on public polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.privacy_level = 'public'
    )
  );

DROP POLICY IF EXISTS "Users can view their own votes" ON votes;
CREATE POLICY "Users can view their own votes" ON votes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create votes" ON votes;
CREATE POLICY "Users can create votes" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.status = 'active'
      AND (polls.end_time IS NULL OR polls.end_time > NOW())
      AND polls.locked_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.status = 'active'
      AND (polls.allow_post_close = true OR polls.end_time IS NULL OR polls.end_time > NOW())
      AND polls.locked_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;
CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

-- USER PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WEBAUTHN CREDENTIALS POLICIES
DROP POLICY IF EXISTS "Users can view their own credentials" ON webauthn_credentials;
CREATE POLICY "Users can view their own credentials" ON webauthn_credentials
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own credentials" ON webauthn_credentials;
CREATE POLICY "Users can create their own credentials" ON webauthn_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own credentials" ON webauthn_credentials;
CREATE POLICY "Users can update their own credentials" ON webauthn_credentials
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own credentials" ON webauthn_credentials;
CREATE POLICY "Users can delete their own credentials" ON webauthn_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- ERROR LOGS POLICIES
DROP POLICY IF EXISTS "Users can view their own error logs" ON error_logs;
CREATE POLICY "Users can view their own error logs" ON error_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert error logs" ON error_logs;
CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- FEEDBACK POLICIES
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
CREATE POLICY "Anyone can submit feedback" ON feedback
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- 3. CREATE RLS POLICIES FOR CIVICS TABLES (PUBLIC READ-ONLY)
-- ============================================================================

-- CIVICS DIVISIONS - Public read-only
DROP POLICY IF EXISTS "Public can read civics divisions" ON civics_divisions;
CREATE POLICY "Public can read civics divisions" ON civics_divisions
  FOR SELECT USING (true);

-- CIVICS REPRESENTATIVES - Public read-only
DROP POLICY IF EXISTS "Public can read civics representatives" ON civics_representatives;
CREATE POLICY "Public can read civics representatives" ON civics_representatives
  FOR SELECT USING (true);

-- CIVICS ADDRESSES - Public read-only
DROP POLICY IF EXISTS "Public can read civics addresses" ON civics_addresses;
CREATE POLICY "Public can read civics addresses" ON civics_addresses
  FOR SELECT USING (true);

-- CIVICS CAMPAIGN FINANCE - Public read-only
DROP POLICY IF EXISTS "Public can read civics campaign finance" ON civics_campaign_finance;
CREATE POLICY "Public can read civics campaign finance" ON civics_campaign_finance
  FOR SELECT USING (true);

-- CIVICS VOTES - Public read-only
DROP POLICY IF EXISTS "Public can read civics votes" ON civics_votes;
CREATE POLICY "Public can read civics votes" ON civics_votes
  FOR SELECT USING (true);

-- ============================================================================
-- 4. CREATE RLS POLICIES FOR BROWSER LOCATION TABLES
-- ============================================================================

-- CIVIC JURISDICTIONS - Public read-only
DROP POLICY IF EXISTS "Public can read civic jurisdictions" ON civic_jurisdictions;
CREATE POLICY "Public can read civic jurisdictions" ON civic_jurisdictions
  FOR SELECT USING (true);

-- JURISDICTION ALIASES - Public read-only
DROP POLICY IF EXISTS "Public can read jurisdiction aliases" ON jurisdiction_aliases;
CREATE POLICY "Public can read jurisdiction aliases" ON jurisdiction_aliases
  FOR SELECT USING (true);

-- JURISDICTION GEOMETRIES - Public read-only
DROP POLICY IF EXISTS "Public can read jurisdiction geometries" ON jurisdiction_geometries;
CREATE POLICY "Public can read jurisdiction geometries" ON jurisdiction_geometries
  FOR SELECT USING (true);

-- JURISDICTION TILES - Public read-only
DROP POLICY IF EXISTS "Public can read jurisdiction tiles" ON jurisdiction_tiles;
CREATE POLICY "Public can read jurisdiction tiles" ON jurisdiction_tiles
  FOR SELECT USING (true);

-- USER LOCATION RESOLUTIONS - User-specific
DROP POLICY IF EXISTS "Users can view their own location resolutions" ON user_location_resolutions;
CREATE POLICY "Users can view their own location resolutions" ON user_location_resolutions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own location resolutions" ON user_location_resolutions;
CREATE POLICY "Users can create their own location resolutions" ON user_location_resolutions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own location resolutions" ON user_location_resolutions;
CREATE POLICY "Users can update their own location resolutions" ON user_location_resolutions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own location resolutions" ON user_location_resolutions;
CREATE POLICY "Users can delete their own location resolutions" ON user_location_resolutions
  FOR DELETE USING (auth.uid() = user_id);

-- LOCATION CONSENT AUDIT - User-specific
DROP POLICY IF EXISTS "Users can view their own consent audit" ON location_consent_audit;
CREATE POLICY "Users can view their own consent audit" ON location_consent_audit
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own consent audit" ON location_consent_audit;
CREATE POLICY "Users can create their own consent audit" ON location_consent_audit
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CANDIDATE JURISDICTIONS - Public read-only
DROP POLICY IF EXISTS "Public can read candidate jurisdictions" ON candidate_jurisdictions;
CREATE POLICY "Public can read candidate jurisdictions" ON candidate_jurisdictions
  FOR SELECT USING (true);

-- ============================================================================
-- 5. ADD PERFORMANCE INDEXES
-- ============================================================================

-- Civics performance indexes
CREATE INDEX IF NOT EXISTS idx_civics_divisions_state_chamber ON civics_divisions(state, chamber);
CREATE INDEX IF NOT EXISTS idx_civics_representatives_ocd ON civics_representatives(ocd_division_id);
CREATE INDEX IF NOT EXISTS idx_civics_representatives_level ON civics_representatives(level);
CREATE INDEX IF NOT EXISTS idx_civics_representatives_jurisdiction ON civics_representatives(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_civics_addresses_state_district ON civics_addresses(state, district);
CREATE INDEX IF NOT EXISTS idx_civics_campaign_finance_candidate ON civics_campaign_finance(candidate_id, cycle);
CREATE INDEX IF NOT EXISTS idx_civics_votes_representative ON civics_votes(representative_id, vote_date);

-- Browser location performance indexes
CREATE INDEX IF NOT EXISTS idx_civic_jurisdictions_parent ON civic_jurisdictions(parent_ocd_id);
CREATE INDEX IF NOT EXISTS idx_civic_jurisdictions_level ON civic_jurisdictions(level);
CREATE INDEX IF NOT EXISTS idx_civic_jurisdictions_state ON civic_jurisdictions(state_code);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_aliases_ocd ON jurisdiction_aliases(ocd_division_id);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_tiles_h3 ON jurisdiction_tiles(h3_index);
CREATE INDEX IF NOT EXISTS idx_candidate_jurisdictions_ocd ON candidate_jurisdictions(ocd_division_id);
CREATE INDEX IF NOT EXISTS idx_user_location_resolutions_user ON user_location_resolutions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_location_resolutions_hash ON user_location_resolutions(address_hash) WHERE address_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_location_consent_audit_user ON location_consent_audit(user_id, created_at DESC);

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================

-- Check RLS is enabled on all tables
SELECT 
  'RLS Status' as check_type,
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'polls', 'votes', 'user_profiles', 'webauthn_credentials', 'error_logs', 'feedback',
    'civics_divisions', 'civics_representatives', 'civics_addresses', 'civics_campaign_finance', 'civics_votes',
    'civic_jurisdictions', 'jurisdiction_aliases', 'jurisdiction_geometries', 'jurisdiction_tiles',
    'user_location_resolutions', 'location_consent_audit', 'candidate_jurisdictions'
  )
ORDER BY tablename;

-- Check policies are created
SELECT 
  'Policy Status' as check_type,
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd, 
  qual as using_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'polls', 'votes', 'user_profiles', 'webauthn_credentials', 'error_logs', 'feedback',
    'civics_divisions', 'civics_representatives', 'civics_addresses', 'civics_campaign_finance', 'civics_votes',
    'civic_jurisdictions', 'jurisdiction_aliases', 'jurisdiction_geometries', 'jurisdiction_tiles',
    'user_location_resolutions', 'location_consent_audit', 'candidate_jurisdictions'
  )
ORDER BY tablename, policyname;

COMMIT;

-- ============================================================================
-- SECURITY FIXES COMPLETE
-- ============================================================================
-- All tables now have RLS enabled with appropriate policies
-- Public civics data is read-only accessible
-- User data is protected by authentication
-- Performance indexes added for common queries
-- ============================================================================
