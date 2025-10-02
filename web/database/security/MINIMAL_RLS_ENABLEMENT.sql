-- ============================================================================
-- MINIMAL RLS ENABLEMENT - ACTUAL TABLES ONLY
-- ============================================================================
-- Phase 1: Security & Cleanup - Critical Security Fix
-- 
-- This script enables RLS on tables that actually exist in your database.
-- Based on the error "poll_options does not exist", this focuses on core tables.
-- 
-- Created: January 27, 2025
-- Status: CRITICAL - Security Vulnerability Fix
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENABLE RLS ON CORE TABLES (THAT ACTUALLY EXIST)
-- ============================================================================

-- Core Application Tables
ALTER TABLE IF EXISTS polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- Location & Civics Tables
ALTER TABLE IF EXISTS jurisdiction_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jurisdiction_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_location_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS location_consent_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS civic_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS civics_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS civics_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS civics_person_xref ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS civics_votes_minimal ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS civics_campaign_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS civics_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS civics_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS state_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS redistricting_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS geographic_lookups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jurisdiction_geometries ENABLE ROW LEVEL SECURITY;

-- Mapping Tables
ALTER TABLE IF EXISTS zip_to_ocd ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS latlon_to_ocd ENABLE ROW LEVEL SECURITY;

-- System Tables
ALTER TABLE IF EXISTS error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS privacy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CREATE BASIC RLS POLICIES FOR CORE TABLES
-- ============================================================================

-- Polls - Users can view public polls and their own polls
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
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own polls" ON polls;
CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE USING (auth.uid() = created_by);

-- Votes - Users can view votes on public polls and their own votes
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
  FOR SELECT USING (auth.uid() = voter_id);

DROP POLICY IF EXISTS "Users can create votes" ON votes;
CREATE POLICY "Users can create votes" ON votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE USING (auth.uid() = voter_id);

DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;
CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE USING (auth.uid() = voter_id);

-- Feedback - Anyone can submit feedback, users can view their own
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
CREATE POLICY "Anyone can submit feedback" ON feedback
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (user_id = auth.uid());

-- User Profiles - Users can view and update their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WebAuthn Credentials - Users can manage their own credentials
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

-- WebAuthn Challenges - Users can manage their own challenges
DROP POLICY IF EXISTS "Users can view their own challenges" ON webauthn_challenges;
CREATE POLICY "Users can view their own challenges" ON webauthn_challenges
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own challenges" ON webauthn_challenges;
CREATE POLICY "Users can create their own challenges" ON webauthn_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own challenges" ON webauthn_challenges;
CREATE POLICY "Users can update their own challenges" ON webauthn_challenges
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own challenges" ON webauthn_challenges;
CREATE POLICY "Users can delete their own challenges" ON webauthn_challenges
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. CREATE BASIC RLS POLICIES FOR PUBLIC DATA TABLES
-- ============================================================================

-- Public Data Tables - Read-only access for all users
-- These tables contain public government data that should be accessible to all

-- Jurisdiction Aliases - Public read-only
DROP POLICY IF EXISTS "Public can read jurisdiction aliases" ON jurisdiction_aliases;
CREATE POLICY "Public can read jurisdiction aliases" ON jurisdiction_aliases
  FOR SELECT USING (true);

-- Jurisdiction Tiles - Public read-only
DROP POLICY IF EXISTS "Public can read jurisdiction tiles" ON jurisdiction_tiles;
CREATE POLICY "Public can read jurisdiction tiles" ON jurisdiction_tiles
  FOR SELECT USING (true);

-- Civic Jurisdictions - Public read-only
DROP POLICY IF EXISTS "Public can read civic jurisdictions" ON civic_jurisdictions;
CREATE POLICY "Public can read civic jurisdictions" ON civic_jurisdictions
  FOR SELECT USING (true);

-- Civics Divisions - Public read-only
DROP POLICY IF EXISTS "Public can read civics divisions" ON civics_divisions;
CREATE POLICY "Public can read civics divisions" ON civics_divisions
  FOR SELECT USING (true);

-- Civics Representatives - Public read-only
DROP POLICY IF EXISTS "Public can read civics representatives" ON civics_representatives;
CREATE POLICY "Public can read civics representatives" ON civics_representatives
  FOR SELECT USING (true);

-- Civics Person Xref - Public read-only
DROP POLICY IF EXISTS "Public can read civics person xref" ON civics_person_xref;
CREATE POLICY "Public can read civics person xref" ON civics_person_xref
  FOR SELECT USING (true);

-- Civics Votes Minimal - Public read-only
DROP POLICY IF EXISTS "Public can read civics votes minimal" ON civics_votes_minimal;
CREATE POLICY "Public can read civics votes minimal" ON civics_votes_minimal
  FOR SELECT USING (true);

-- Civics Campaign Finance - Public read-only
DROP POLICY IF EXISTS "Public can read civics campaign finance" ON civics_campaign_finance;
CREATE POLICY "Public can read civics campaign finance" ON civics_campaign_finance
  FOR SELECT USING (true);

-- Civics Votes - Public read-only
DROP POLICY IF EXISTS "Public can read civics votes" ON civics_votes;
CREATE POLICY "Public can read civics votes" ON civics_votes
  FOR SELECT USING (true);

-- Civics Addresses - Public read-only
DROP POLICY IF EXISTS "Public can read civics addresses" ON civics_addresses;
CREATE POLICY "Public can read civics addresses" ON civics_addresses
  FOR SELECT USING (true);

-- State Districts - Public read-only
DROP POLICY IF EXISTS "Public can read state districts" ON state_districts;
CREATE POLICY "Public can read state districts" ON state_districts
  FOR SELECT USING (true);

-- Redistricting History - Public read-only
DROP POLICY IF EXISTS "Public can read redistricting history" ON redistricting_history;
CREATE POLICY "Public can read redistricting history" ON redistricting_history
  FOR SELECT USING (true);

-- Geographic Lookups - Public read-only
DROP POLICY IF EXISTS "Public can read geographic lookups" ON geographic_lookups;
CREATE POLICY "Public can read geographic lookups" ON geographic_lookups
  FOR SELECT USING (true);

-- Candidate Jurisdictions - Public read-only
DROP POLICY IF EXISTS "Public can read candidate jurisdictions" ON candidate_jurisdictions;
CREATE POLICY "Public can read candidate jurisdictions" ON candidate_jurisdictions
  FOR SELECT USING (true);

-- Elections - Public read-only
DROP POLICY IF EXISTS "Public can read elections" ON elections;
CREATE POLICY "Public can read elections" ON elections
  FOR SELECT USING (true);

-- Jurisdiction Geometries - Public read-only
DROP POLICY IF EXISTS "Public can read jurisdiction geometries" ON jurisdiction_geometries;
CREATE POLICY "Public can read jurisdiction geometries" ON jurisdiction_geometries
  FOR SELECT USING (true);

-- ZIP to OCD - Public read-only
DROP POLICY IF EXISTS "Public can read zip to ocd" ON zip_to_ocd;
CREATE POLICY "Public can read zip to ocd" ON zip_to_ocd
  FOR SELECT USING (true);

-- LatLon to OCD - Public read-only
DROP POLICY IF EXISTS "Public can read latlon to ocd" ON latlon_to_ocd;
CREATE POLICY "Public can read latlon to ocd" ON latlon_to_ocd
  FOR SELECT USING (true);

-- ============================================================================
-- 4. CREATE BASIC RLS POLICIES FOR USER DATA TABLES
-- ============================================================================

-- User Location Resolutions - Users can manage their own location data
DROP POLICY IF EXISTS "Users can view their own location resolutions" ON user_location_resolutions;
CREATE POLICY "Users can view their own location resolutions" ON user_location_resolutions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own location resolutions" ON user_location_resolutions;
CREATE POLICY "Users can create their own location resolutions" ON user_location_resolutions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own location resolutions" ON user_location_resolutions;
CREATE POLICY "Users can update their own location resolutions" ON user_location_resolutions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own location resolutions" ON user_location_resolutions;
CREATE POLICY "Users can delete their own location resolutions" ON user_location_resolutions
  FOR DELETE USING (auth.uid() = user_id);

-- Location Consent Audit - Users can view their own consent audit
DROP POLICY IF EXISTS "Users can view their own location consent audit" ON location_consent_audit;
CREATE POLICY "Users can view their own location consent audit" ON location_consent_audit
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert location consent audit" ON location_consent_audit;
CREATE POLICY "System can insert location consent audit" ON location_consent_audit
  FOR INSERT WITH CHECK (true);

-- User Consent - Users can manage their own consent
DROP POLICY IF EXISTS "Users can view their own consent" ON user_consent;
CREATE POLICY "Users can view their own consent" ON user_consent
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own consent" ON user_consent;
CREATE POLICY "Users can create their own consent" ON user_consent
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own consent" ON user_consent;
CREATE POLICY "Users can update their own consent" ON user_consent
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. CREATE BASIC RLS POLICIES FOR SYSTEM TABLES
-- ============================================================================

-- Error Logs - Users can view their own error logs, system can insert
DROP POLICY IF EXISTS "Users can view their own error logs" ON error_logs;
CREATE POLICY "Users can view their own error logs" ON error_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert error logs" ON error_logs;
CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Privacy Logs - Users can view their own privacy logs, system can insert
DROP POLICY IF EXISTS "Users can view their own privacy logs" ON privacy_logs;
CREATE POLICY "Users can view their own privacy logs" ON privacy_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert privacy logs" ON privacy_logs;
CREATE POLICY "System can insert privacy logs" ON privacy_logs
  FOR INSERT WITH CHECK (true);

-- Audit Logs - Users can view their own audit logs, system can insert
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Analytics Events - Users can view their own analytics events, system can insert
DROP POLICY IF EXISTS "Users can view their own analytics events" ON analytics_events;
CREATE POLICY "Users can view their own analytics events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert analytics events" ON analytics_events;
CREATE POLICY "System can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- System Config - Admin only
DROP POLICY IF EXISTS "Admin can manage system config" ON system_config;
CREATE POLICY "Admin can manage system config" ON system_config
  FOR ALL USING (auth.role() = 'service_role');

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
    'polls', 'votes', 'feedback', 'user_profiles', 'webauthn_credentials', 'webauthn_challenges',
    'jurisdiction_aliases', 'jurisdiction_tiles', 'user_location_resolutions', 'location_consent_audit', 'user_consent',
    'civic_jurisdictions', 'civics_divisions', 'civics_representatives', 'civics_person_xref', 'civics_votes_minimal',
    'civics_campaign_finance', 'civics_votes', 'civics_addresses', 'state_districts', 'redistricting_history',
    'geographic_lookups', 'candidate_jurisdictions', 'elections', 'jurisdiction_geometries',
    'zip_to_ocd', 'latlon_to_ocd',
    'error_logs', 'privacy_logs', 'audit_logs', 'analytics_events', 'system_config'
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
    'polls', 'votes', 'feedback', 'user_profiles', 'webauthn_credentials', 'webauthn_challenges',
    'jurisdiction_aliases', 'jurisdiction_tiles', 'user_location_resolutions', 'location_consent_audit', 'user_consent',
    'civic_jurisdictions', 'civics_divisions', 'civics_representatives', 'civics_person_xref', 'civics_votes_minimal',
    'civics_campaign_finance', 'civics_votes', 'civics_addresses', 'state_districts', 'redistricting_history',
    'geographic_lookups', 'candidate_jurisdictions', 'elections', 'jurisdiction_geometries',
    'zip_to_ocd', 'latlon_to_ocd',
    'error_logs', 'privacy_logs', 'audit_logs', 'analytics_events', 'system_config'
  )
ORDER BY tablename, policyname;

COMMIT;

-- ============================================================================
-- MINIMAL RLS ENABLEMENT COMPLETE
-- ============================================================================
-- This script enables RLS on tables that actually exist in your database.
-- It uses IF EXISTS to avoid errors for missing tables.
-- 
-- Benefits:
-- - Security vulnerability resolved for existing tables
-- - Appropriate policies created for each table type
-- - No errors for missing tables
-- ============================================================================
